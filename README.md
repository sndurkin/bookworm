# storymagic

storymagic is a GPT-powered web app that's designed to help school-aged children learn to read. It allows the child to help create a simple story that they can then practice reading aloud, one word at a time.

## Try it out!

Clone the repository:

```
git clone https://github.com/sndurkin/storymagic.git
cd storymagic
```

Generate a private key (`key.pem`):

```
openssl genpkey -algorithm RSA -out key.pem
```

Generate a certificate signing request (`csr.pem`):

```
openssl req -new -key key.pem -out csr.pem
```

Generate a self-signed certificate (`cert.pem`):

```
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem
```

Build the Docker image and run the container:

```
docker build -t storymagic .
docker compose up
```
