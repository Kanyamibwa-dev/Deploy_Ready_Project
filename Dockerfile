# Small, fast base image
FROM node:20-alpine

# Create a dedicated non-root user/group to run the app as
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only the manifest files first so `npm ci` is cached
# unless dependencies actually change (faster rebuilds)
COPY app/package*.json ./

# Install production dependencies only (no dev/test deps in the image)
RUN npm ci --omit=dev

# Copy the rest of the application source
COPY app/ ./

# The app reads process.env.PORT and falls back to 3000 if unset
ENV PORT=3000
EXPOSE 3000

# Make sure the non-root user owns the app files, then switch to it
RUN chown -R appuser:appgroup /app
USER appuser

CMD ["node", "server.js"]
