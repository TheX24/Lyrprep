# Step-by-step guide for creating synced lyrics for Spicy Lyrics

> [!TIP]
> Prefer watching over reading? Check out this video tutorial, created by **[@iPixelGalaxy](https://profile.spicylyrics.org/ipixelgalaxy)** and **[@yesspapa](https://profile.spicylyrics.org/yesspapa)**!
> <mux-player playback-id="cRdWSU28crVXW7e9mtRfXcixE01mSWrqQdR1EpP02wg7s" style="margin-top:0.75rem;" metadata-video-title="TTML Making Guide | Spicy Lyrics" accent-color="#3771cd"></mux-player>

---

> [!WARNING]
> <b>Do not use AI or any other "Spicy Lyrics non-verified tool" to make or modify TTML files.</b><br>
> All <b>official</b> tools will be available at [spicylyrics.org/app](https://spicylyrics.org/app/tools/) once you are a TTML Maker.<br>
> <b>NEVER modify your TTML files via a plain text editor.</b> Always use the AMLL TTML Tool or other official tools provided by Spicy Lyrics.

> [!TIP]
> If you don't know an abbreviation or a phrase we use in the guide, just check the [Spicy Lyrics Glossary & Abbreviations](https://blog.spicylyrics.org/posts/spicy-lyrics-glossary-and-abbreviations) blog post.

We will use the [AMLL TTML Tool by Steve-xmh](https://amll-ttml-tool.stevexmh.net/) to make TTMLs.<br>
The tool can also be downloaded for Windows, Linux, and macOS from [this link](https://github.com/amll-dev/amll-ttml-tool/releases/tag/main-release).

<details>
<summary>How to switch Steve-xmh's AMLL TTML Tool into English</summary>

![A GIF showing how to switch the TTML Editor webapp into English]({cdn_prefix}/useruploads/balint2201/guidemedia/LanguageSwitch.fbe2bf6f.webp)

</details>

## 1. Download and import a song

To download a song you can either:
- Use a website, like [SpotiDown.App](https://spotidown.app/).
- Or use an app like [SpotiFLAC](https://github.com/afkarxyz/SpotiFLAC) for Windows, Linux, and macOS.<br>Using SpotiFLAC will help you use the spectrogram in the TTML tool, as MP3s do not have good enough quality for that use case, while FLAC files do. Using MP3s will make the spectrogram look blurry/washed out.

![A GIF showing how to upload a song to the AMLL TTML Tool webapp.]({cdn_prefix}/useruploads/balint2201/guidemedia/AudioImport.9f8669ec.webp)
> [!TIP]
>  - You can adjust the volume and playback speed by hovering over the icon.

## 2. Format the lyrics

The lyrics should be formatted as follows:
- All lyric lines must start with uppercase letters. There are a few exceptions, such as when a line starts with a reference to a name/title that intentionally starts with a lowercase letter (e.g. album: "skatulya II.", artist: "bbno$").
- Lyric lines must not contain dots, commas, ellipsis points, or any other punctuation/special characters except `!`, `?`, `'`, `"`, `:`, `—`.
- If a line trails off or a word does not finish, use an em dash (`—`) instead of ellipsis points. Normal dashes must not be used for this.
- If there are repeated parts in a line, or words are said quickly between vocal disfluencies/filler sounds and dashes cannot be used (example where dashes can be used: `Come-come-come to Brazil`), use an em dash (e.g. `Ehh, that's why I go for so— ahh`), optionally with a comma (e.g. `Ehh, that's why I go for so—, ahh`). Both forms are accepted.
- Lyrics should follow the grammar of the respective language (if the song mixes languages, each part should follow its appropriate language's grammar).
- Capitalization should follow basic grammar (as explained above), so in English, for example, `I` should always be capitalized. (An exception is artists like Billie Eilish, who works directly with Apple Music (Spicy Lyrics' main lyrics provider), and whose lyric capitalization follows her song titles.)
- If two different filler words follow each other (e.g. `Yeah, oh` or `Ehh, ohh`), you should use commas to separate them.
- If two of the same filler words follow each other (e.g. `Yeah-yeah` or `Oh-oh`) you should use dashes between them.
- When separating filler words with dashes, there must not be any spaces before or after the dashes.
- The quality of your lyrics (commas, capitalization, etc.) is expected to be perfect so moderators do not have to fix them. Make sure your lyrics are properly formatted.

For any questions, you should check the [Genius Lyrics Formatting Guide](https://genius.com/9298624). If you do not find the answer there, ask a moderator.

## 3. Prepare the lyrics for importing
We will use [Lyrprep](https://lyrprep.spicylyrics.org/) to prepare the lyrics.
1. Click the little search button at the top-right corner of the "INPUT" box.
2. You will be searching for the lyrics on LRCLIB.
3. You will be able to enter the track name, the artist(s) and the album's name.
4. After you have entered everything you need, hit "Search" and the results will come up.
5. Select the best one and copy the text that comes up in the "OUTPUT" box with the little copy button.

> [!NOTE]
> - To get lyrics via a Spotify link ("Spicy Lyrics" tab), you need to log in at [spicylyrics.org/app](https://spicylyrics.org/app/tools/lyrprep) (you will be able to log in after you are an official TTML Maker).
> - Even though you can use links to get lyrics, LRCLIB will most likely have more and better lyrics than the ones you get through a link (from Apple Music).

> [!TIP]
> If you are planning to sync line-by-line lyrics, you should skip this step. (There is no need to split the lyrics into words.)
 
## 4. Import the lyrics
> [!IMPORTANT]
> Make sure to have this switch ("Enable Special Prefix") enabled.
>
> ![An image showing the AMLL TTML Tool's "Import via plain text" settings with the "Enable Special Prefix" on.]({cdn_prefix}/useruploads/balint2201/guidemedia/EnableSpecialPrefix.7eab5d6c.webp)

Most of the time, you will be importing lyrics via plain text prepared by [Lyrprep](https://lyrprep.spicylyrics.org/).

![A GIF showing how to use "Import via plain text" feature on the AMLL TTML Tool webapp.]({cdn_prefix}/useruploads/balint2201/guidemedia/TextImport.2690a031.webp)

## 5. Mark the lyrics
After successfully importing the lyrics, it is time to mark duet vocals and missing background lines.
Here are some ground rules:

- Two background lines can't follow each other.
- A song can't start with a background line.
- A singer (for example, in a duet) can't start with a background line.
- A singer (for example, in a duet) can't consist of only one background line.
- The primary artist should be the first singer. If there are more than two singers, the primary artist should have their first part (or longest part, if their first one is very short) as the first singer.
- If there are recordings/other voices in the song that are marked with quotes, they should be duet lines.
- When there are three or more singers, duet lines should take turns. The only exception is when there are two short recordings/other voices: they should be on the duet side so the primary artist can keep the first-singer side.

If any of your formatting is incorrect, a moderator will correct it.

## 6. Syncing the lyrics

Switch to the "Time" tab, select the first word and sync!

> [!NOTE]
> The GIF shows an older version of the webapp where "Time" was called "Sync Mode".

![A GIF showing how to switch to the "Time" tab and select the first word on the AMLL TTML Tool webapp.]({cdn_prefix}/useruploads/balint2201/guidemedia/SyncTab.6a391ae0.webp)
Main keybinds:
- F - sets the start time of the word
- G - sets the end time of the word and the start of the next word (if the performer sings without pauses)
- H - sets the end time of the word (if there is a pause before the next word)
- A/D - switches words left/right
- Left arrow/right arrow - rewind/fast forward the audio by 5 seconds

> [!TIP]
> - You can edit the text and add new lines in the "Edit" tab
> - If the singer sings too fast, reduce the playback speed by hovering over the musical note icon
> - It is VERY IMPORTANT to have the lowest possible audio latency, as this is important for accuracy (the lowest latency is achieved by using a wired connection, if available, for the audio device you are using)
> - You can make a line a background line by selecting the line and checking "Background Vocal" in "Line Properties" under "Edit Mode"
> - You can do the same for a second singer by checking "Duet Vocal"
> - Checking the "Obscene Word" checkbox under the "Word Content" text area will not change anything inside of Spicy Lyrics


### This is a fairly lengthy process and requires exceptional precision, but here is a brief description of the process:

1.  Play the song, and when you hear the beginning of a word, press F and G (or H) when the next word begins.
![A GIF showing how syncing happens on the AMLL TTML Tool website.]({cdn_prefix}/62df780c416f74da60fe4b83a44c02c0971aa2ac.gif)
2.  Process the line and double-check the synchronization for errors, then move on to the next line.
3.  When you have finished synchronizing, perform a final check and proceed to the next step.

After you are done syncing, use the spectrogram to fix timings where you slipped up, like so:
1. To move words around, drag them with the cursor while holding left-click.
2. To make words longer or shorter, drag the start/end time of the word while holding right-click or the scroll wheel.
3. To play a word/syllable, right-click on it once.
4. To only see the currently selected line (useful when lines overlap, e.g. background vocals), click the eye icon in the bottom-right corner of the spectrogram window.
5. To change what the spectrogram shows (where you are in the song), use the scroll wheel on the spectrogram to move around. You can also drag it on the playback bar with left-click.
6. You can set the view field/length of the spectrogram by dragging its sides on the playback bar with either mouse button.
7. You can change the intensity/visibility of the spectrogram visualizer colors with the slider on the left.

> [!TIP]
> Use H when the singer stops to breathe. This usually occurs at the end of lines or before terminal punctuation (e.g., a question mark in the middle of a line).

> [!WARNING]
> If your browser is translating the AMLL TTML Tool website, the webpage may not function as intended. Never translate the website.

## 7. Adding songwriters
To see the "Written by:" at the end of the lyrics container in Spicy Lyrics, you need to add the songwriters.<br>
To add the songwriters, follow the instructions in the GIF below, or use the menu path below (inside the AMLL TTML Tool website): <br>
`Edit > Edit lyrics metadata... > Add new key-value > Songwriter`

![A GIF showing how to add the "songwriters" metadata on the AMLL TTML Tool website.]({cdn_prefix}/useruploads/balint2201/guidemedia/WebMetadataEditor.6c949ed4.webp)


> [!IMPORTANT]
> Always use the songwriters' real names (unless they are unknown). To find the songwriters, right-click on the song title in the bottom-left corner, then choose the `View credits` option and check the `Written by` section.<br>
> In the new Credits layout (from Spotify 1.2.83), look for people with the `Lyricist` tag under their names.
> ![A GIF showing how to get the songwriters from Spotify.]({cdn_prefix}/useruploads/balint2201/guidemedia/WrittenBySection.1610dfdb.webp)

> [!TIP]
> To copy songwriters easily, use the [creditsClickCopy](https://github.com/Balint2201/creditsClickCopy) extension by Balint2201. To install it, open the Spicetify Marketplace and search for it. You may have to click the "Load More" button to find it. All usage instructions can be found in the extension's README.

> [!WARNING]
> Each songwriter must be added individually.

> [!TIP]
> You can find the songwriters on Spicy Lyrics if you scroll to the end of the song's lyrics. <br>
> <b>You should not add your name to the TTML metadata.</b> Your username (your nickname in the Spicy Lyrics Discord server) will be visible (alongside the uploader's nickname) once the TTML is uploaded. <br>
> (The uploader is usually the moderator who approves your sync/submission)
> ![An image showing the 'Written by:' section in the Spotify App with Spicy Lyrics installed, at the bottom of the lyrics page]({cdn_prefix}/useruploads/balint2201/guidemedia/InAppCredits.f305197f.webp)

## 8. Export the lyrics
![A GIF showing how to export a TTML on the AMLL TTML Tool website.]({cdn_prefix}/useruploads/balint2201/guidemedia/TTMLExport.0d72336b.webp)

> [!CAUTION]
> If the lyrics have empty lines, the TTML file won't load into Spicy Lyrics.<br>
> If any end timings in the lyrics are `00:00.000`, the file will not load properly.

## 9. Checks and uploading
- Enable "TTML Maker Mode" in the extension's settings and load your TTML file by clicking on the "`<>`" button (by default at the top, but it may be at the bottom depending on your settings) of the lyrics page, then click on "Load TTML" and select the file.
- If it has loaded and parsed successfully, all lines are in place, and there are no errors or mistakes, then go to the "[create-a-ticket](https://discord.com/channels/1369992682214264993/1420470843414413403)" channel in the [Spicy Lyrics Discord Server](https://discord.com/invite/uqgXU5wh8j).
- If the file is all good, your TTML will be uploaded and you will receive the "TTML Maker" role.
- After that, to submit more TTMLs, you can use the [#TTML-Uploads](https://discord.com/channels/1369992682214264993/1372633004584992808) channel (you will be able to see the channel after you get the rank).
- You can upgrade your "TTML Maker" role by uploading more often and making more accurately synced lyrics.

---
---

<h6>This guide is improving over time, and some parts are subject to change. Thanks for reading, and have a great time making TTMLs for the community!</h6>
<h6>The GIFs shown above may have been made for an older version of the tool, but the core process is the same. We are always working on providing you with the latest information.</h6>

Written guide by: **[@Balint2201](https://github.com/Balint2201)**<br>
Video guide by: **[@iPixelGalaxy](https://profile.spicylyrics.org/ipixelgalaxy)**, **[@yesspapa](https://profile.spicylyrics.org/yesspapa)**<br>
Sources: **[@roranfeed](https://github.com/roranfeed)**, **[@TX24](https://github.com/TheX24)**, **[@spikerko](https://github.com/Spikerko)**