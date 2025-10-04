import { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

interface ClassManglerOptions {
  /** Minimum length of generated class names (default: 1) */
  min?: number;
  /** Maximum length of generated class names (default: 4) */
  max?: number;
  /** Fixed length for generated class names (overrides min/max) */
  length?: number;
  /** File extensions to process (default: ['.html', '.vue', '.jsx', '.tsx', '.svelte']) */
  suffixes?: string[];
  /** Prefix for generated class names */
  prefix?: string;
  /** Suffix for generated class names */
  suffix?: string;
  /** Class names to ignore from mangling */
  ignore?: string[];
  /** Generate mapping file (default: true) */
  generateMapping?: boolean;
  /** Path to save mapping file (default: 'class-mapping.json') */
  mappingPath?: string;
  /** Reserved class names that should not be mangled */
  reserved?: string[];
  /** Whether to mangle CSS class names in stylesheets (default: true) */
  mangleCss?: boolean;
  /** Skip classes that start with these prefixes (e.g. ['fa', 'icon-']) */
  skipStartsWith?: string[];
  /** Skip classes that end with these suffixes (e.g. ['-icon', '-btn']) */
  skipEndsWith?: string[];
  /**
   * Selects the algorithm for generating mangled class names (default: "hash").
   * - "hash": Generates a deterministic hash based on the original class name (same input always produces the same output).
   * - "generic": Generates a random class name (output may change between builds).
   */
  classNameGeneratorAlg?: "hash" | "generic"
}

interface ClassMapping {
  [originalClass: string]: string;
}

function log(...content: string[]) {
  console.log("[ClassMangler]", ...content)
}

function logError(...content: string[]) {
  console.error("[ClassMangler]", ...content);
}

export default function classManglerPlugin(options: ClassManglerOptions = {}): Plugin {
  const {
    min = 1,
    max = 4,
    length,
    suffixes = ['.html', '.vue', '.jsx', '.tsx', '.svelte', '.ts', '.js'],
    prefix = '',
    suffix = '',
    ignore = [],
    generateMapping = true,
    mappingPath = 'class-mapping.json',
    reserved = [],
    mangleCss = true,
    skipStartsWith = [],
    skipEndsWith = [],
    classNameGeneratorAlg = "hash"
  } = options;

  let classMapping: ClassMapping = {};
  let classCounter = 0;
  let isDev = false;
  let outputDir = 'dist';

  // Generate a random-looking class name (e.g., oXO9_yYs6JyOwkBn8E4a)

  const classNamesGeneratorFuncs = {
    hash_generateClassName: (originalClass: string): string => {
      const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    
      // Decide requested length
      const targetLength = length || Math.floor(Math.random() * (max - min + 1)) + min;
    
      // Create SHA-256 hash buffer
      const hash = crypto.createHash('sha256').update(originalClass).digest();
    
      // First char: must be a letter
      let result = letters[hash[0] % letters.length];
    
      // Fill up to targetLength using allowed chars
      let i = 1;
      while (result.length < targetLength) {
        result += chars[hash[i % hash.length] % chars.length];
        i++;
      }
    
      return prefix + result + suffix;
    },
    generic_generateClassName: (): string => {
      // Ensure first character is always a letter
      const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
    
      const targetLength = length || Math.floor(Math.random() * (max - min + 1)) + min;
    
      function getRandomChar(pool: string) {
        return pool[Math.floor(Math.random() * pool.length)];
      }
    
      // First character must be a letter
      let result = getRandomChar(letters);
    
      // Remaining characters can be any allowed char
      for (let i = 1; i < targetLength; i++) {
        result += getRandomChar(chars);
      }
    
      // Optionally, ensure uniqueness by appending a counter if needed
      result += classCounter > 0 ? classCounter.toString(36) : '';
      classCounter++;
    
      return prefix + result + suffix;
    }
  }

  function generateClassName(originalClass: string): string {
    if (classNameGeneratorAlg === "hash") {
      return classNamesGeneratorFuncs.hash_generateClassName(originalClass);
    } else {
      return classNamesGeneratorFuncs.generic_generateClassName();
    }
  }
    

  // Escape special regex characters properly
  function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Check if class should be skipped based on prefix/suffix rules
  function shouldSkipClass(className: string): boolean {
    // Check explicit ignore list
    if (ignore.includes(className) || reserved.includes(className)) {
      return true;
    }

    // Check startsWith patterns
    if (skipStartsWith.length > 0) {
      for (const prefix of skipStartsWith) {
        if (className.startsWith(prefix)) {
          return true;
        }
      }
    }

    // Check endsWith patterns
    if (skipEndsWith.length > 0) {
      for (const suffix of skipEndsWith) {
        if (className.endsWith(suffix)) {
          return true;
        }
      }
    }

    return false;
  }

  // Get or create mangled class name
  function getMangledClassName(originalClass: string): string {
    if (shouldSkipClass(originalClass)) {
      return originalClass;
    }

    if (!classMapping[originalClass]) {
      classMapping[originalClass] = generateClassName(originalClass);
    }

    return classMapping[originalClass];
  }

  // Extract class names from HTML/template/JS/TS content, including classList.add/remove/toggle, etc.
  function extractClassNames(content: string): string[] {
    const classes: string[] = [];
  
    const patterns = [
      // HTML/JSX/TSX: class="foo bar" or className="foo bar"
      /class(?:Name)?\s*=\s*["']([^"']+)["']/g,
      // JSX: className={`foo bar`}
      /className\s*=\s*\{[`'"]([^`'"]+)[`'"]\}/g,
      // JS: classList.add('foo', "bar", ...)
      /classList\.(?:add|remove|toggle)\s*\(\s*([^)]+)\)/g,
      // JS: setAttribute('class', 'foo bar')
      /\.setAttribute\s*\(\s*['"]class['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g,
      // Svelte: class:foo
      /class:([a-zA-Z][a-zA-Z0-9_-]*)/g,
      // getElementsByClassName('foo bar') or getElementsByClassName("foo bar")
      /getElementsByClassName\s*\(\s*["']([^"']+)["']\s*\)/g,
      // querySelector/All with any quote or backtick type, capturing class selectors
      /querySelector(All)?\s*\(\s*([`"'"])([^`"']+)\2\s*\)/g,
    ];
  
    // Helper to extract class names from a string (space/comma separated)
    function extractNames(str: string): string[] {
      if (!str) return [];
      return str
        .split(/[\s,]+/)
        .map(s => s.trim())
        .filter(name => name && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name));
    }
  
    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // classList.add/remove/toggle args
        if (pattern.source.startsWith('classList')) {
          const argPattern = /['"`]([^'"`]+)['"`]/g;
          let argMatch;
          while ((argMatch = argPattern.exec(match[1])) !== null) {
            classes.push(...extractNames(argMatch[1]));
          }
        }
        // Svelte class:foo
        else if (pattern.source.startsWith('class:')) {
          classes.push(match[1]);
        }
        // getElementsByClassName
        else if (pattern.source.startsWith('getElementsByClassName')) {
          classes.push(...extractNames(match[1]));
        }
        // querySelector/All with any quote type
        else if (pattern.source.startsWith('querySelector')) {
          // Selectors captured in match[3]
          const selector = match[3];
          if (!selector) continue; // Defensive check
          // Find all .classname selectors in the string
          const classSelectorPattern = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
          let csMatch;
          while ((csMatch = classSelectorPattern.exec(selector)) !== null) {
            classes.push(csMatch[1]);
          }
        }
        // All other patterns
        else {
          classes.push(...extractNames(match[1]));
        }
      }
    });
  
    return [...new Set(classes)];
  }
  
  

  // Extract ONLY CSS class selectors, not file extensions or URLs
  function extractCssClassNames(content: string): string[] {
    const classes: string[] = [];

    // Only match CSS class selectors that are clearly classes
    const patterns = [
      // Match .classname { (CSS class definitions)
      /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*\{/g,
      // Match .classname, (CSS class in selectors)
      /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*,/g,
      // Match .classname:hover, .classname:focus etc (pseudo selectors)
      /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*:/g,
      // Match .classname at end of selector
      /\.([a-zA-Z][a-zA-Z0-9_-]*)\s*$/gm
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const className = match[1];
        // Additional validation to ensure it's a real CSS class
        if (className && 
            !className.includes('.') && // No file extensions
            !className.match(/^(com|org|net|css|js|woff|woff2|ttf|png|jpg|svg)$/i) && // No common extensions/domains
            className.length > 1) { // Must be longer than 1 character
          classes.push(className);
        }
      }
    });

    return [...new Set(classes)];
  }

  // Transform content with better specificity
  function transformContent(content: string, isCSS = false): string {
    let transformedContent = content;
  
    if (isCSS) {
      const sortedClasses = Object.entries(classMapping).sort(([a], [b]) => b.length - a.length);
      
      for (const [originalClass, mangledClass] of sortedClasses) {
        // Match full class names only, not substrings
        // This pattern matches .className when it's NOT followed by another valid class character
        const classBoundary = '(?![a-zA-Z0-9_-])';
        const pattern = new RegExp(`\\.${escapeRegExp(originalClass)}${classBoundary}`, 'g');
        transformedContent = transformedContent.replace(pattern, `.${mangledClass}`);
        
        // Also handle pseudo-functions like :not(.classname), :has(.classname), :is(.classname)
        const pseudoFns = ['not', 'has', 'is'];
        pseudoFns.forEach(fn => {
          const pseudoPattern = new RegExp(`(:${fn}\\(\\s*)\\.${escapeRegExp(originalClass)}(\\s*\\))`, 'g');
          transformedContent = transformedContent.replace(pseudoPattern, `$1.${mangledClass}$2`);
        });
      }
    } else {
      // Transform class names in templates/JS using precise matching
      
      // Method 1: Handle class attributes by splitting and mapping (most robust)
      transformedContent = transformedContent.replace(
        /class(?:Name)?\s*=\s*(["`'])([^"`']*?)\1/g,
        (match, quote, classNames) => {
          const mangledClasses = classNames
            .split(/\s+/)
            .filter(cls => cls.length > 0)
            .map(cls => classMapping[cls] || cls)
            .join(' ');
          return `class${match.includes('Name') ? 'Name' : ''}=${quote}${mangledClasses}${quote}`;
        }
      );
  
      // Method 2: Handle classList operations with exact matching
      for (const [originalClass, mangledClass] of Object.entries(classMapping)) {
        const classListMethods = ['add', 'remove', 'toggle', 'contains'];
        const quoteTypes = [`'`, `"`, '`'];
        
        for (const method of classListMethods) {
          for (const quote of quoteTypes) {
            const searchString = `classList.${method}(${quote}${originalClass}${quote})`;
            if (transformedContent.includes(searchString)) {
              transformedContent = transformedContent.split(searchString)
                .join(`classList.${method}(${quote}${mangledClass}${quote})`);
            }
          }
        }
        
        // Method 3: Handle querySelector with exact class selector matching
        const quoteTypes2 = [`'`, `"`, '`'];
        quoteTypes2.forEach(quote => {
          const querySelectorPatterns = [
            `querySelector(${quote}.${originalClass}${quote})`,
            `querySelectorAll(${quote}.${originalClass}${quote})`
          ];
          
          querySelectorPatterns.forEach(pattern => {
            if (transformedContent.includes(pattern)) {
              const mangledPattern = pattern.replace(originalClass, mangledClass);
              transformedContent = transformedContent.split(pattern).join(mangledPattern);
            }
          });
        });
  
        // Method 4: Handle template string class usage like `.${className}` or `"${className}"`
        const templatePatterns = [
          `.${originalClass} `,
          `.${originalClass}"`,
          `.${originalClass}'`,
          `.${originalClass}\``,
          `.${originalClass}}`,  // For template literals
          `.${originalClass})`,  // For function calls
        ];
        
        templatePatterns.forEach(pattern => {
          if (transformedContent.includes(pattern)) {
            const mangledPattern = pattern.replace(originalClass, mangledClass);
            transformedContent = transformedContent.split(pattern).join(mangledPattern);
          }
        });
      }
    }
  
    return transformedContent;
  }  

  // Save mapping to file with directory creation and skip statistics
  function saveMappingFile(): void {
    if (!generateMapping) {
      return;
    }

    try {
      const fullPath = path.resolve(mappingPath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Enhanced mapping with metadata
      const mappingData = {
        timestamp: new Date().toISOString(),
        totalClasses: Object.keys(classMapping).length,
        configuration: {
          skipStartsWith: skipStartsWith,
          skipEndsWith: skipEndsWith,
          ignore: ignore,
          reserved: reserved
        },
        mapping: classMapping
      };

      fs.writeFileSync(fullPath, JSON.stringify(mappingData, null, 2));
      log(`Class mapping saved to ${fullPath}`);

      // Log skip statistics
      if (skipStartsWith.length > 0 || skipEndsWith.length > 0) {
        log(`Skipped classes starting with: [${skipStartsWith.join(', ')}]`);
        log(`Skipped classes ending with: [${skipEndsWith.join(', ')}]`);
      }
    } catch (error) {
      logError('Failed to save class mapping:', error);
    }
  }

  return {
    name: 'vite-plugin-class-mangler',
    enforce: "pre",

    configResolved(config) {
      isDev = config.command === 'serve';
      outputDir = config.build.outDir || 'dist';
    },

    buildStart() {
      if (isDev) {
        return;
      }

      classMapping = {};
      classCounter = 0;
      log('Class mangler: Starting build...');

      // Log configuration
      if (skipStartsWith.length > 0) {
        log(`Will skip classes starting with: [${skipStartsWith.join(', ')}]`);
      }
      if (skipEndsWith.length > 0) {
        log(`Will skip classes ending with: [${skipEndsWith.join(', ')}]`);
      }
    },

    transform(code: string, id: string) {
      if (isDev) {
        return null;
      }


      const cleanId = id.split('?')[0];
      const fileExtension = path.extname(cleanId);

      if (id.includes('node_modules')) {
        return null;
      }

      
      if (!suffixes.includes(fileExtension)) {
        return null;
      }

      
      let shouldTransform = false;
      let extractedClasses: string[] = [];

      try {
        if (fileExtension === '.css' || fileExtension === '.scss' || fileExtension === '.sass' || fileExtension === '.less') {
          if (mangleCss) {
            extractedClasses = extractCssClassNames(code);
            shouldTransform = extractedClasses.length > 0;
          }
        } else {
          extractedClasses = extractClassNames(code);
          shouldTransform = extractedClasses.length > 0;
        }

        if (!shouldTransform) {
          return null;
        }

        // Process classes and track skipped ones
        let mangledCount = 0;
        let skippedCount = 0;

        extractedClasses.forEach(className => {
          if (className) {
            if (shouldSkipClass(className)) {
              skippedCount++;
            } else {
              getMangledClassName(className);
              mangledCount++;
            }
          }
        });

        const isCSS = fileExtension === '.css' || fileExtension === '.scss' || fileExtension === '.sass' || fileExtension === '.less';
        const transformedCode = transformContent(code, isCSS);

        log("Processed File", id)

        return {
          code: transformedCode,
          map: null
        };
      } catch (error) {
        logError(`Error transforming ${id}:`, error);
        return {
          code: code,
          map: null
        };
      }
    },

    buildEnd() {
      if ((isDev) || Object.keys(classMapping).length === 0) {
        return;
      }

      log(`Class mangler: Mangled ${Object.keys(classMapping).length} class names`);
      saveMappingFile();
    },

    generateBundle(options, bundle) {
      if (isDev) {
        return;
      }

      try {
        Object.keys(bundle).forEach(fileName => {
          const file = bundle[fileName];

          if (file.type === 'asset' && fileName.endsWith('.css') && mangleCss) {
            let cssContent = file.source as string;

            const cssClasses = extractCssClassNames(cssContent);
            cssClasses.forEach(className => {
              if (!shouldSkipClass(className)) {
                getMangledClassName(className);
              }
            });

            file.source = transformContent(cssContent, true);
          }
        });
      } catch (error) {
        logError('Error in generateBundle:', error);
      }
    }
  };
}

export type { ClassManglerOptions };
