# Publishing and rollback

The package serves prebuilt static files through nginx on container port 8080. Production Compose binds it to `127.0.0.1:8091`, matching the existing host nginx upstream for `danishdave.com`. `/en`, `/en/`, `/da` and `/da/` redirect to the home page. Missing routes return the custom 404 with an HTTP 404 status. Media supports byte-range requests for video seeking. Hashed Astro assets have immutable caching; media has a one-hour cache.

These are operator instructions. Building a package does not publish it. A publish requires David’s explicit approval.

## Build and inspect locally

```sh
npm run package:release -- /path/to/private/release-output
cd /path/to/private/release-output
sha256sum -c portfolio-RELEASE.tar.gz.sha256
tar -xzf portfolio-RELEASE.tar.gz
cd portfolio-RELEASE
docker build -t portfolio:RELEASE .
docker run --rm --name portfolio-preview -p 127.0.0.1:8097:8080 portfolio:RELEASE
```

Inspect `http://127.0.0.1:8097/` and the case studies. Check a missing route, `/en`, and a video seek. A release archive contains `dist/`, nginx/Docker configuration, release metadata and these instructions. Its Docker build sends only the generated public files and nginx configuration as context. The runtime has no Node/PHP process, application secrets or writable content volume.

Use an immutable tag for the reviewed image. The Dockerfile pins the reviewed stable Alpine nginx image by digest; record the built image ID alongside the release.

## Prepare Hetzner without affecting the live site

The current deployment is the `portfolio-app` container under `/home/david/portfolio`, serving revision `293908d` (`v-1.1.4`). That directory is an operational deployment directory, not a Git checkout. Keep the source archive in a separate release directory, such as `/home/david/portfolio-releases/RELEASE`. Transfer the reviewed package and checksum, verify the checksum, extract it there and build the reviewed image.

Inspect and save the live container before the cutover:

```sh
install -d -m 700 /home/david/portfolio-backups/RELEASE
docker inspect portfolio-app > /home/david/portfolio-backups/RELEASE/container.json
docker image inspect "$(docker inspect --format '{{.Image}}' portfolio-app)" > /home/david/portfolio-backups/RELEASE/image.json
cp -a /home/david/portfolio /home/david/portfolio-backups/RELEASE/deployment
docker tag "$(docker inspect --format '{{.Image}}' portfolio-app)" portfolio:before-RELEASE
```

Run the new image temporarily on `127.0.0.1:8097` and verify it before approval. Check that the preview port is free first. Do not bind the preview to 8091 while the live container owns that port. Do not change the host nginx upstream for this release.

## Approved cutover

From the extracted release directory, stop the preview if it is running, then preserve the complete live container before starting the new one:

```sh
docker stop portfolio-app
docker rename portfolio-app portfolio-app-before-RELEASE
PORTFOLIO_IMAGE=portfolio:RELEASE docker compose -p portfolio-static -f docker-compose.prod.yml up -d
curl --fail http://127.0.0.1:8091/
curl --fail https://danishdave.com/
curl -I https://danishdave.com/en
curl -I https://danishdave.com/work/panelforge/
docker inspect --format '{{.State.Health.Status}}' portfolio-app
```

Check the public home page, case studies and captioned recordings in a browser. The health check can take up to 30 seconds to update. Keep the saved container, image and deployment directory until the release has been accepted.

## Rollback

If any cutover or public check fails, stop and remove only the new Compose service, then restore the saved container:

```sh
PORTFOLIO_IMAGE=portfolio:RELEASE docker compose -p portfolio-static -f docker-compose.prod.yml down
docker rename portfolio-app-before-RELEASE portfolio-app
docker start portfolio-app
curl --fail http://127.0.0.1:8091/en
curl --fail https://danishdave.com/en
```

Renaming preserves the saved container’s ports, environment, mounts and startup command. The backup deployment directory and `portfolio:before-RELEASE` image are a second recovery path. No database migration or application-data change is part of the static-site cutover.
