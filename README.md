# Flowreel
## This project was created using [Create t3 app](https://create.t3.gg/).

## Also using socket io as extra feature for the chat system.

### To run this project on your own computer you need to have installed:
- #### Docker
- #### Bun

# Running this project
### 1. You need to have downloaded or cloned this project.
### 2. Docker has to be open and running.
### 3. You must create a new file called .env.
### 4. Copy the contents of .env.example and put it in .env.
### 5. You need to fill in the blank variables with your own data.
### 6. Lastly you have to use these commands to run the project:
- ##### bun install
- ##### docker-compose up -d
### If you have run the previous commands, open up a new terminal and run:
- ##### docker-compose exec app bun db:generate
- ##### docker-compose exec app bun db:push

## Bun installation:

### Windows
Run the following command in powershell:

powershell -c "irm bun.sh/install.ps1|iex"

### macOS and Linux
curl -fsSL https://bun.sh/install | bash

