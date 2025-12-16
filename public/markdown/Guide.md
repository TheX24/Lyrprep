# Step-by-step guide for creating lyrics for Spicy Lyrics
Made by **[@Balint2201](https://github.com/Balint2201)**, **[@roranfeed](https://github.com/roranfeed)**, **[@TX24](https://github.com/TheX24)**, **[@Spikerko](https://github.com/Spikerko)**
> [!WARNING]
> **Do not use AI or any other "Spicy Lyrics non-verified tool" to make or modify TTML files.**

We will use [AMLL TTML Tool Fork by Streetle](https://streetlegithub.github.io/amll-ttml-tool-english)

## 1. Upload a song
![A GIF showing how to upload a song to the AMLL TTML Tool website.](https://wdeliverystatic.global.ic.spicylyrics.org/wclient/a-cdn/lyrprep/40f40d8e0eaa25df7eb0b29c60b83394ca6c567d.gif)
> [!TIP]
>  - You can download a song [here](https://spotidown.app/).
>  - You can also adjust the volume and playback speed by hovering over the icon.

## 2. Prepare the lyrics
1. Click on the little search icon at the top-right corner of the input box.
2. Enter the song link and click search
3. Click on the arrow to process if it hasn't already
4. Copy the output

> [!IMPORTANT]
> - If you don't find any lyrics, try searching with LRCLIB (which often has more songs).
> - To get lyrics via a Spotify link, you need to log in at [interface.spicylyrics.org](https://interface.spicylyrics.org/dashboard/lyrprep) (this page will be available even when you aren't an official TTML Maker yet).
 
## 3. Import the lyrics
> [!IMPORTANT]
> Make sure to have this switch ("Enable Special Prefix") enabled.
> ![An image showing the AMML TTML Tool's "Import via plain text" settings with the "Enable Special Prefix" on.](https://wdeliverystatic.global.ic.spicylyrics.org/wclient/a-cdn/lyrprep/73a1321b1cc687c555d0efdac628a264a9401be2.png)

![A GIF showing how to use "Import via plain text" feature on the AMLL TTML Tool website.](https://wdeliverystatic.global.ic.spicylyrics.org/wclient/a-cdn/lyrprep/2dab5e2d14bf6604495829f6441da044428510b7.gif)

## 4. Switch to the "Sync Mode" tab, select the first word and sync!
![A GIF showing how to switch to the "Sync" tab and select the first word on the AMLL TTML Tool website](https://wdeliverystatic.global.ic.spicylyrics.org/wclient/a-cdn/lyrprep/1bbd056e227a1c70961cdc1b89f8d044fbe7de27.gif)
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
> - Checking the "Obscene Word" checkbox under the "Word Content" textarea will not change anything inside of SpicyLyrics.

### This is a fairly lengthy process and requires exceptional precision, but here is a brief description of the process:

1.  Play the song, and when you hear the beginning of a word, press F and G (or H) when the next word begins.
![A GIF showing how syncing happens on the AMLL TTML Tool website.](https://wdeliverystatic.global.ic.spicylyrics.org/wclient/a-cdn/lyrprep/62df780c416f74da60fe4b83a44c02c0971aa2ac.gif)
2.  Process the line and double-check the synchronization for errors, then move on to the next line.
3.  When you have finished synchronizing, perform a final check and proceed to the next step.

## 5. Export the lyrics
![A GIF showing how to export a TTML on the AMLL TTML Tool website.](https://wdeliverystatic.global.ic.spicylyrics.org/wclient/a-cdn/lyrprep/858861398ae95a3121d33d614c1a7e55a9729ff4.gif)

## 6. Adding song writers
If you want to see the "Written by:" at the end of the lyrics container in Spicy Lyrics, you need to mention the song writers.
And to do that, put this into the `<metadata>` element (right before the `</metadata>`):
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
> Never beautify your TTMLs because your file won't be able to load properly/at all. The extension needs to read it, not us.

> [!IMPORTANT]
> Always use the songwriters' real names (unless it's unknown). To find the songwriters, right-click on the song title in the bottom-left corner, then choose the `View credits` option and check the `Written by` section.

> [!NOTE]
> Replace John Doe, Jane Doe and John Nolan with the actual song writers.

> [!WARNING]
> Each song writer must be added individually.

> [!NOTE]
> Alternatively you can use the AMLL TTML Tool website's own Metadata Editor menu under `Edit > Edit Lyrics Metadata > Add New Metadata > Songwriter`. You can add all the songwriters here. The other metadata settings do nothing.

> [!TIP]
> You can find the songwriters on Spicy Lyrics if you scroll to the end of the song lyrics. After your TTML got uploaded by a Mod, you will see your discord username, alongside the uploader's username (The uploader is usually the moderator who checks and approves your lyrics).
> ![An image showing the "Credists" (Now renamed to "Written by:") section in the Spotify App with Spicy Lyrics installed, at the bottom of the lyrics tab](https://wdeliverystatic.global.ic.spicylyrics.org/wclient/a-cdn/lyrprep/f9754fc997c7548c8d00e86ea71634fb42a7970e.png)

## 7. Checks and Uploading
#### Enable "Dev Mode" in the extension's settings and load your TTML file by clicking on the "`<>`" button at the top (default to be on the top but it's a setting, so might be at the bottom for you) of the lyrics page, then click on "Load" and select the file.
> [!NOTE]
> The "Upload" button has now been renamed to "Load TTML" to avoid further confusion. This is to clarify the fact that <ins>when you (up)load from the DEV popup, it does NOT make the TTML publicly accessible,</ins> you need to make a ticket for that. Read below for more info.
#### If it has loaded and parsed successfully, all the lines are in place, and there are no errors, then go to the "[create-a-ticket](https://discord.com/channels/1369992682214264993/1420470843414413403)" channel in the Spicy Lyrics Discord Server.
#### If the file is all good, you will receive the "TTML Maker" role and then make a post in [#TTML-Uploads](https://discord.com/channels/1369992682214264993/1372633004584992808) (available after receiving the rank).
#### You can upgrade your "TTML Maker" role by uploading more often and making more accurately synced lyrics.
#### By creating a post you automatically accept the [TTML Maker's Privacy Policy](https://discord.com/channels/1369992682214264993/1422189425491705896).
