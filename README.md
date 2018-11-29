# ampache for volumio

This is largely in a working state, but there's so much that I could do but probably
won't as I've decided that perhaps creating an API derived from Subsonic might be the
way forward.

Anyhow, this is being released - if you can improve it, feel free but this is currently
in use in my local so it does work!

## Things to improve/fix

- Fix bug where sometimes volumio/ampache takes forever to load results (loading too many, perhaps?)
- Fix UI issue involving artists (album art is not being resolved for artists)
- Add in support for playlists
- Add in support for smart playlists
- Fix global search (currently it works when namespaced)
- Fix the back button (it is completely... broken)

## Installation

Because the current way of installing plugins within volumio can only be described as insane, I personally
would just wget latest .zip and unzip straight into your plugin folder.
