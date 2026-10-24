Put these files from your CURRENT HabitOS project into THIS folder (app/):

  manifest.webmanifest   (your existing one)
  sw.js                  (your existing one)
  icons/                 (your existing folder)

index.html in this folder is already the updated app. Then open app/manifest.webmanifest and make sure:
  "start_url": "/app/",
  "scope": "/app/",
and open app/sw.js and change any absolute paths such as '/index.html' or '/icons/...' to '/app/index.html' and '/app/icons/...'.
Delete this text file afterwards.
