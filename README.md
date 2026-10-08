# IRHS Tech Club — Two-laptop poster

Use the same files on both laptops. Keep both poster tabs visible.

## Pair the displays

1. Left laptop: choose CREATE LEFT SCREEN.
2. Read the six-character ROOM code at the top left.
3. Right laptop: choose JOIN RIGHT SCREEN, enter that code, and select JOIN.
4. Wait for PAIRED on both displays, then enter fullscreen with F.

The right display follows the left display’s ticker clock over a PeerJS data connection. Timing messages contain only clock values, speed, and ticker phrases. The invitation links are not sent over the pairing connection. PeerJS uses its cloud signaling service to connect the laptops, so internet access and a network that allows WebRTC are required. If pairing fails, click the room status to retry. Both tabs must remain visible.

## Controls

F: fullscreen. C: display alignment. X, Y and scale are saved per laptop.
Reset alignment clears previous settings. Ticker timing adjusts the left display’s clock when paired; the right follows it automatically. Direct ?screen=left and ?screen=right URLs remain available without pairing.

The poster requests screen awake mode automatically where supported. The screen-awake button lets you turn it off.

## Club details

Tuesdays at lunch, Room 131. Instagram: @irhs.technology.
Activities: 3D printing; microcontrollers; computer teardowns; portfolio websites with AI.

The QR images are embedded in app.js and work without an external QR service. If a link changes, regenerate its embedded QR image as well as updating config.js.

The vendor folder contains PeerJS 1.5.5 and its MIT license. Upload every file, including vendor, for hosting.
