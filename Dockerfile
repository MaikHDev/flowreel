# Use the official Bun image as the base image
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Install PostgreSQL client
RUN apt-get update && apt-get install -y postgresql-client

# Copy package.json and bun.lockb (if exists)
COPY package.json ./
COPY bun.lock* ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Set environment variables for database connection (these will be overridden at runtime)
#ENV NODE_ENV=development

# Build the Next.js application
#RUN SKIP_ENV_VALIDATION=1 bun run build

# Expose the port the app will run on
EXPOSE 3000

# Command to run the application
#CMD ["bun", "run", "src/server.ts", "--watch"]
CMD ["bun", "run", "dev"]
