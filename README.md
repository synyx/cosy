# synyx-remote

spiel, spaß und spannung

![](./docs/screen.gif)

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
