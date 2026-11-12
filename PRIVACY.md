# Privacy

Stash Roulette runs entirely in your browser.

- **Your files** are read only when you pick, preview or attach them. They are handed to the page's message box the same way a file you chose yourself would be. They are never uploaded by this script and never leave your machine except through the action you take on the site.
- **No network requests.** The script does not call any server, load remote code, or send analytics.
- **What is stored, and where:** the folder permission handle and a small index of file size, date and video length (browser storage for the site), and your layout and shuffle settings (userscript manager storage). Nothing identifies you.
- **Frames:** to reach a chat that lives in an embedded frame, the script may pass the chosen file to frames on x.com, twitter.com or discord.com only, addressed to that exact origin. It never sends files to other origins.
- **Logs:** debug logging is off by default and never records file names.

To remove everything, delete the script in your userscript manager and clear the site data for x.com and discord.com.
