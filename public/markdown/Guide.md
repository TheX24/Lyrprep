# Step-by-step guide for creating synced lyrics for Spicy Lyrics
Contributors: **[@roranfeed](https://github.com/roranfeed)**, **[@TX24](https://github.com/TheX24)**, **[@Balint2201](https://github.com/Balint2201)**, **[@Spikerko](https://github.com/Spikerko)**, **[@iPixelGalaxy](https://profile.spicylyrics.org/ipixelgalaxy)**, **[@yesspapa](https://profile.spicylyrics.org/yesspapa)**

> [!TIP]
> Prefer watching over reading? Check out this video tutorial, created by **[@iPixelGalaxy](https://profile.spicylyrics.org/ipixelgalaxy)** and **[@yesspapa](https://profile.spicylyrics.org/yesspapa)**
> <mux-player playback-id="cRdWSU28crVXW7e9mtRfXcixE01mSWrqQdR1EpP02wg7s" style="margin-top:0.75rem;" metadata-video-title="TTML Making Guide | Spicy Lyrics" accent-color="#3771cd"></mux-player>


> [!WARNING]
> **Do not use AI or any other "Spicy Lyrics non-verified tool" to make or modify TTML files.**
> All **official** tools will be available at [spicylyrics.org](https://spicylyrics.org/app/tools) once you are a TTML Maker.

We will use the [AMLL TTML Tool by Steve-xmh](https://amll-ttml-tool.stevexmh.net/) to make TTMLs.
> [!NOTE] 
> You can also use [AMLL TTML Tool Fork by Streetle](https://streetlegithub.github.io/amll-ttml-tool-english). Choice mainly depends on your preference, but both of them work the same way and the guide is the same for both.

<details>
<summary>How to switch Steve-xmh's AMLL TTML Tool into English</summary>

![A GIF showing how to switch the TTML Editor webapp into English]({cdn_prefix}/useruploads/balint2201/guidemedia/LanguageSwitch.fbe2bf6f.webp)

</details>

## 1. Upload a song
![A GIF showing how to upload a song to the AMLL TTML Tool webapp.]({cdn_prefix}/useruploads/balint2201/guidemedia/AudioImport.9f8669ec.webp)
> [!TIP]
>  - You can download a song [here](https://spotidown.app/).
>  - You can also adjust the volume and playback speed by hovering over the icon.

## 2. Prepare the lyrics for syncing
We will use [Lyrprep](https://lyrprep.spicylyrics.org/) to prepare the lyrics.
1. Click the little search button at the top-right corner of the "INPUT" box.
2. You will be able to enter the track name, the artist(s) and the album's name.
3. After you entered everything you need, hit "Search" and the results will come up.
4. Select the best one and copy the text that comes up in the "OUTPUT" box with the little copy button.

> [!NOTE]
> - ~~To get lyrics via a Spotify link, you need to log in at [spicylyrics.org](https://spicylyrics.org/app/tools/lyrprep) (you will be able to log in after you are an official TTML Maker).~~ As of 5/9/2026, you are no longer able to get TTMLs from Spotify links from this site.
> - Even when you can use links to get lyrics, LRCLIB will most likely have more and better lyrics, than the one you get with a link (from Apple Music).

> [!TIP]
> If you are planning on syncing line-by-line lyrics you should skip this step (preparing lyrics with Lyrprep)
 
## 3. Import the lyrics
> [!IMPORTANT]
> Make sure to have this switch ("Enable Special Prefix") enabled.
>
> ![An image showing the AMML TTML Tool's "Import via plain text" settings with the "Enable Special Prefix" on.]({cdn_prefix}/useruploads/balint2201/guidemedia/EnableSpecialPrefix.7eab5d6c.webp)

For most of the time, you will be importing lyrics via plain text, prepared by [Lyrprep](https://lyrprep.spicylyrics.org/)

![A GIF showing how to use "Import via plain text" feature on the AMLL TTML Tool webapp.]({cdn_prefix}/useruploads/balint2201/guidemedia/TextImport.2690a031.webp)

## 4. Switch to the "Sync Mode" / "Time" tab, select the first word and sync!
> [!NOTE]
> On one of the AMLL TTML Tool websites the tab is called "Sync Mode" while it is called "Time" on the other.

![A GIF showing how to switch to the "Sync Mode" / "Time" tab and select the first word on the AMLL TTML Tool webapp.]({cdn_prefix}/useruploads/balint2201/guidemedia/SyncTab.6a391ae0.webp)
Main keybinds:
- F - sets the start time of the word
- G - sets the end time of the word and the start of the next word (if the performer sings without pauses)
- H - sets the end time of the word (if there is a pause before the next word)
- A/D - switches words left/right
- Left arrow/right arrow - rewind/fast forward the audio by 5 seconds

> [!TIP]
> - You can edit the text and add new lines in the Edit tab
> - If the singer sings too fast, reduce the playback speed by hovering over the musical note icon
> - It is VERY IMPORTANT to have the lowest possible audio latency, as this is important for accuracy (the lowest latency is achieved by using a wired connection, if available, for the audio device you are using)
> - You can make a line a background line by selecting the line and checking "Background Vocal" in "Line Properties" under "Edit Mode"
> - You can do the same for a second singer by checking "Duet Vocal"
> - Checking the "Obscene Word" checkbox under the "Word Content" text area will not change anything inside of Spicy Lyrics.

> [!NOTE]
> Two background lines can't follow each other.<br>
> A song can't start with a background line.<br>
> A singer (for example a duet) can't start with a background line.<br>
> A singer (for example a duet) can't be one singular background line.

### This is a fairly lengthy process and requires exceptional precision, but here is a brief description of the process:

1.  Play the song, and when you hear the beginning of a word, press F and G (or H) when the next word begins.
![A GIF showing how syncing happens on the AMLL TTML Tool website.]({cdn_prefix}/62df780c416f74da60fe4b83a44c02c0971aa2ac.gif)
2.  Process the line and double-check the synchronization for errors, then move on to the next line.
3.  When you have finished synchronizing, perform a final check and proceed to the next step.

> [!TIP]
> Use H when the singer stops to breathe. This usually occurs at the end of the lines or at a terminal punctuation (e.g., A question mark in the middle of a line).

> [!WARNING]
> If your browser is translating the AMLL TTML Tool website, the webpage may not function as intended. Never translate the website.

## 5. Export the lyrics
![A GIF showing how to export a TTML on the AMLL TTML Tool website.]({cdn_prefix}/useruploads/balint2201/guidemedia/TTMLExport.0d72336b.webp)

> [!CAUTION]
> If the lyrics have empty lines, the TTML file won't load into Spicy Lyrics.

## 6. Adding songwriters
If you want to see the "Written by:" at the end of the lyrics container in Spicy Lyrics, you need to add the songwriters.<br>
To add the songwriters you need to follow the instructions of the GIF below or go in the order below (inside the AMLL TTML Tool website): <br>
`Edit > Edit Lyrics Metadata > Add New Metadata > Songwriter`

![A GIF showing how to add the "songwriters" metadata on the AMLL TTML Tool website.]({cdn_prefix}/useruploads/balint2201/guidemedia/WebMetadataEditor.6c949ed4.webp)

<details>
<summary>Adding songwriters manually (NOT RECOMMENDED)</summary>


To add songwriters manually, put this into the `<metadata>` element (right before the `</metadata>`):
```ttml
<iTunesMetadata xmlns="http://music.apple.com/lyric-ttml-internal" leadingSilence="0">
<translations/>
<songwriters>
<songwriter>John Doe</songwriter>
<songwriter>Jane Doe</songwriter>
<songwriter>John Nolan</songwriter>
</songwriters>
</iTunesMetadata>
```

> [!CAUTION]
> <b>Adding songwriters manually is very risky because it often breaks your TTMLs. We advise you to <ins>never add songwriters manually.</ins> Use the website instead.</b>


</details>

> [!IMPORTANT]
> Always use the songwriters' real names (unless it's unknown). To find the songwriters, right-click on the song title in the bottom-left corner, then choose the `View credits` option and check the `Written by` section.
> ![A GIF showing how to get the songwriters from Spotify.]({cdn_prefix}/useruploads/balint2201/guidemedia/WrittenBySection.1610dfdb.webp)

> [!NOTE]
> You can't copy songwriters from Spotify unless you have devtools enabled via this Spicetify command: `spicetify enable-devtools`
> After you have enabled devtools, you can copy them by selecting them one-by-one and right-clicking them, then selecting Copy in the menu. Keep in mind that devtools can be buggy and is not intended to be used by rookies.

> [!WARNING]
> Each songwriter must be added individually.

> [!TIP]
> You can find the songwriters on Spicy Lyrics if you scroll to the end of the song lyrics. After your TTML got uploaded by a Mod, you will see your Discord username, alongside the uploader's username (The uploader is usually the moderator who checks and approves your lyrics).
> ![An image showing the "Written by:" section in the Spotify App with Spicy Lyrics installed, at the bottom of the lyrics page]({cdn_prefix}/useruploads/balint2201/guidemedia/InAppCredits.f305197f.webp)

## 7. Checks and Uploading
- Enable "TTML Maker Mode" in the extension's settings and load your TTML file by clicking on the "`<>`" button (by default at the top, but it may be at the bottom depending on your settings) of the lyrics page, then click on "Load TTML" and select the file.
- If it has loaded and parsed successfully, all the lines are in place, and there are no errors or mistakes, then go to the "[create-a-ticket](https://discord.com/channels/1369992682214264993/1420470843414413403)" channel in the [Spicy Lyrics Discord Server](https://discord.com/invite/uqgXU5wh8j).
- If the file is all good, you will receive the "TTML Maker" role and then make a post in [#TTML-Uploads](https://discord.com/channels/1369992682214264993/1372633004584992808) (available after receiving the rank).
- You can upgrade your "TTML Maker" role by uploading more often and making more accurately synced lyrics.

<h6>This guide is improving over time, some parts are subject to changes. Thanks for reading, have a great time making some TTMLs for the community.</h6>
