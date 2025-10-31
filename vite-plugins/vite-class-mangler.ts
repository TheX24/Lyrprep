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
      // JS: classList.add('foo', "bar", ...), .contains(), .replace() etc.
      /classList\.(?:add|remove|toggle|contains|replace)\s*\(\s*([^)]+)\)/g,
      // JS: setAttribute('class', 'foo bar')
      /\.setAttribute\s*\(\s*['"]class['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g,
      // Svelte: class:foo
      /class:([a-zA-Z][a-zA-Z0-9_-]*)/g,
      // getElementsByClassName('foo bar') or getElementsByClassName("foo bar")
      /getElementsByClassName\s*\(\s*["']([^"']+)["']\s*\)/g,
      // querySelector/All with optional TypeScript generic and any quote or backtick type
      /querySelector(All)?(?:<[^>]*>)?\s*\(\s*([`"'"])([^`"']+)\2\s*\)/g,
      // .closest('.some-class')
      /\.closest\s*\(\s*([`"'"])([^`"']+)\1\s*\)/g,
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
        // classList methods can have multiple string arguments
        if (pattern.source.includes('classList')) {
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
        else if (pattern.source.includes('querySelector')) {
          // Selectors captured in match[3] (since the generic is a non-capturing group)
          const selector = match[3];
          if (!selector) continue; // Defensive check
          // Find all .classname selectors in the string
          const classSelectorPattern = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
          let csMatch;
          while ((csMatch = classSelectorPattern.exec(selector)) !== null) {
            classes.push(csMatch[1]);
          }
        }
        // closest('.some-class')
        else if (pattern.source.includes('closest')) {
          // Selectors captured in match[2]
          const selector = match[2];
          if (!selector) continue;
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
        // This function uses callbacks with String.prototype.replace to robustly handle transformations
        // without complex and brittle loops over the class mapping.

        // Sort classes by length, descending, to prevent replacing 'btn' inside 'btn-primary'
        const sortedClasses = Object.keys(classMapping).sort((a, b) => b.length - a.length);

        // Method 1: Handle class="foo bar" or className="foo bar"
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

        // Method 2: Handle getElementsByClassName("foo bar")
        transformedContent = transformedContent.replace(
          /getElementsByClassName\s*\(([`"'`])([^`"']+?)\1\)/g,
          (match, quote, classNames) => {
            const mangledClasses = classNames
              .split(/\s+/)
              .filter(cls => cls.length > 0)
              .map(cls => classMapping[cls] || cls)
              .join(' ');
            return `getElementsByClassName(${quote}${mangledClasses}${quote})`;
          }
        );

        // Method 3: Handle querySelector('.foo.bar') with optional TS Generics
        transformedContent = transformedContent.replace(
            /querySelector(All)?(<[^>]*>)?\s*\(([`"'`])(.*?)\3\)/g,
            (match, all, generic, quote, selector) => {
                let newSelector = selector;
                for (const originalClass of sortedClasses) {
                    if (newSelector.includes(`.${originalClass}`)) {
                        const mangledClass = classMapping[originalClass];
                        // Regex to match .className not followed by other valid class characters
                        const pattern = new RegExp(`\\.${escapeRegExp(originalClass)}(?![a-zA-Z0-9_-])`, 'g');
                        newSelector = newSelector.replace(pattern, `.${mangledClass}`);
                    }
                }
                return `querySelector${all || ''}${generic || ''}(${quote}${newSelector}${quote})`;
            }
        );

        // Method 4: Handle classList methods like .add('foo', 'bar')
        transformedContent = transformedContent.replace(
            /classList\.(add|remove|toggle|contains|replace)\([^)]*\)/g,
            (match) => {
                let newMatch = match;
                for (const originalClass of sortedClasses) {
                    if (!newMatch.includes(originalClass)) continue;

                    const mangledClass = classMapping[originalClass];
                    // Replace the class name inside quotes
                    const quoteTypes = [`'`, `"`, '`'];
                    quoteTypes.forEach(quote => {
                        const pattern = `${quote}${originalClass}${quote}`;
                        if (newMatch.includes(pattern)) {
                            newMatch = newMatch.replace(new RegExp(escapeRegExp(pattern), 'g'), `${quote}${mangledClass}${quote}`);
                        }
                    });
                }
                return newMatch;
            }
        );

        // Method 5: Handle closest('.foo.bar')
        transformedContent = transformedContent.replace(
            /\.closest\s*\(([`"'`])(.*?)\1\)/g,
            (match, quote, selector) => {
                let newSelector = selector;
                for (const originalClass of sortedClasses) {
                    if (newSelector.includes(`.${originalClass}`)) {
                        const mangledClass = classMapping[originalClass];
                        // Regex to match .className not followed by other valid class characters
                        const pattern = new RegExp(`\\.${escapeRegExp(originalClass)}(?![a-zA-Z0-9_-])`, 'g');
                        newSelector = newSelector.replace(pattern, `.${mangledClass}`);
                    }
                }
                return `.closest(${quote}${newSelector}${quote})`;
            }
        );
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
      
      let extractedClasses: string[] = [];
      let shouldTransform = false;

      try {
        // --- BRANCH 1: Pure CSS Files (e.g., .css, .scss) ---
        if (fileExtension === '.css' || fileExtension === '.scss' || fileExtension === '.sass' || fileExtension === '.less') {
          if (mangleCss) {
            extractedClasses = extractCssClassNames(code);
            shouldTransform = extractedClasses.length > 0;

            if (!shouldTransform) {
              return null;
            }

            // Populate map
            extractedClasses.forEach(className => {
              if (className && !shouldSkipClass(className)) {
                getMangledClassName(className);
              }
            });

            // Transform
            const transformedCode = transformContent(code, true); // isCSS = true
            log("Processed File (CSS)", id);
            return {
              code: transformedCode,
              map: null
            };
          }
          // If mangleCss is false, just return null and do nothing
          return null;
        } 
        
        // --- BRANCH 2: HTML/JS/Vue/Svelte/etc. Files ---
        else { 
          // 1. Extract from HTML/JS attributes and scripts
          extractedClasses = extractClassNames(code); 

          // 2. Extract from <style> tags
          const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
          let styleMatch;
          const styleTagClasses: string[] = [];

          if (mangleCss) { // Only do this if mangleCss is on
            while ((styleMatch = styleTagRegex.exec(code)) !== null) {
              const styleContent = styleMatch[1];
              if (styleContent) {
                styleTagClasses.push(...extractCssClassNames(styleContent));
              }
            }
          }

          // Combine all unique classes
          const allExtractedClasses = [...new Set([...extractedClasses, ...styleTagClasses])];
          
          if (allExtractedClasses.length === 0) {
            return null; // No classes found at all
          }

          // 3. Process and populate the mapping
          allExtractedClasses.forEach(className => {
            if (className && !shouldSkipClass(className)) {
              getMangledClassName(className); // Populates the map
            }
          });

          // 4. Transform the content
          // First, transform the HTML/JS part
          let transformedCode = transformContent(code, false); // isCSS = false

          // Second, transform the CSS inside the <style> tags
          if (mangleCss && styleTagClasses.length > 0) {
            // We use the regex again on the *already transformed* (HTML-wise) code.
            // This is safe, as transformContent(isCSS=false) doesn't touch <style> contents.
            transformedCode = transformedCode.replace(
              styleTagRegex,
              (fullMatch, styleContent) => {
                const transformedStyleContent = transformContent(styleContent, true); // isCSS = true
                // Reconstruct the full match, replacing only the content
                return fullMatch.replace(styleContent, transformedStyleContent);
              }
            );
          }
          
          log("Processed File (HTML/JS/Vue/etc.)", id);

          return {
            code: transformedCode,
            map: null
          };
        }
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

