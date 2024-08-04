# frida-cocosjs
Reverse engineering apps which using cocos2d-x (js) for android

Features:
* Extract .jsc files from APK
* Create Frida script to change .jsc files at runtime

# Requirements
Node:
* `esbuild` (run `npm i`)
Python:
* `frida-tools`
* `typer`

# Usage
Run `git clone https://github.com/frida-cocosjs`

cocos2d-x encrypts **all** .jsc files using `xxtea`, while it is possible to brute or find the key using static analysis, it is much easier if you run `npm run dump-key`

This will create `index.js` file with script, now you have to use frida server with `frida -Uf package.name -l index.js` or gadget (listen) with `frida -U Gadget -l index.js`

Once you got the key, use `python src/main.py extract APK KEY` to extract sources

After you made changes, run `python src/main.py replace APK` to generate Frida script with changes. Now you can inject it using [fgi](https://github.com/commonuserlol/fgi) into APK or use `frida-server`

* **NOTE**: You can pass directory name to both commands where sources should be placed

* **NOTE**: `replace` command accepts script name (defaults to `index.js`)

# Static vs dynamic replacement
We could use static replacement (in APK) without Frida, but that forces us to use [fgi](https://github.com/commonuserlol/fgi) or another project as a dependency and also negatively affects development (when you need quick feedback)

# License
This project is licensed under GNU AGPLv3. See [LICENSE](LICENSE) for details