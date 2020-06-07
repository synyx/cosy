# synyx-remote

spiel, spaß und spannung

![](./docs/screen.gif)

## Run

if you just want to start the app:

```bash
node src/server/index.js
```

### Logging

Bibliotheken wie `koa-session` verwenden [debug] zum loggen.

Logging kann mit der `DEBUG` Umgebungsvariable aktiviert werden.  
Mehr Infos gibt es auf https://github.com/visionmedia/debug

> tldr;  
> `DEBUG=* node src/server/index.js`

Cosy loggt mit `console.log` auf _stdout_ und verwendet auch [debug] mit namespace `cosy` / `cosy:*`

## Development

Was du brauchst:

- NodeJS 12
- synyx Internet / aktiver synyx VPN

Wie du startest:

- `npm install`: installiert alle benötigten Dependencies
- `npm run dev`: startet den Server und hört auf Änderungen im Code um ihn neu zu starten

Rufe dann die URL die dir gesagt wird im Browser auf (müsste `http://localhost:3000` sein).

Einloggen kannst du dich mit deinen LDAP Credentials.

Um den Multiplayer lokal ausprobieren zu können kannst du dich im
`dev` Modus auch mit loken Benutzern einloggen. Das Passwort ist bei diesen Benutzern egal. Es
muss jedoch mindestens ein Zeichen sein. Die lokalen Benutzer kannst du in der [local-users.json](./local-users.json)
Datei pflegen.

### VSCode Debug

Lege eine neue _run configuration_ an:

```
// ./vscode/launch.json
"configurations": [
	{
		"type": "node",
		"request": "launch",
		"name": "Launch Program [local]",
		"skipFiles": ["<node_internals>/**"],
		"program": "${workspaceFolder}/src/server/index.js",
		"env": {
			"DEBUG": "*",
			"NODE_ENV": "development"
		},
		"outputCapture": "std"
	}
]
```

* `env:DEBUG=*`: logge alles von Bibliotheken die [debug] nutzen
  * kann eingeschränkt werden mit z. B. `env:DEBUG=koa-route`. Dann wird nur `koa-route` geloggt
* `outputCapture:std`: [debug] loggt auf `stderr`. mit `outputCapture:std` wird alles in der _debug console_ von VSCode geloggt

[debug]: https://github.com/visionmedia/debug
