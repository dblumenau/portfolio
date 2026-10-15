# Publishing and rollback

The release package serves prebuilt static files through nginx on container port 8080. Production Compose binds `127.0.0.1:8091`, matching the host nginx upstream for `danishdave.com`. `/en`, `/en/`, `/da` and `/da/` return relative 301 redirects to `/`. Missing routes return the custom page with HTTP404. Media supports byte ranges; hashed Astro assets have immutable caching and media has a one-hour cache.

Production has used the static runtime since `v-2.0.0`. For a subsequent release, preserve the immediately preceding static container, image and package directory. Its tmpfs directories are temporary nginx runtime state, not persistent application data. Older Laravel recovery material remains a separate retained checkpoint; restore releases in reverse order using the matching release records. Do not run an older rollback executor against a newer deployment.

Publication requires David's authorization. Building and checking a package does not publish it. An existing authorization covers the requested release; these instructions add no further approval step. Commands below use Bash with `set -euo pipefail` so a failed check stops the sequence. Remote steps share one shell's recorded variables; save the release record before closing it.

## Verify and package the final commit

Commit the reviewed source and record its full object ID before verification. Package from a clean detached checkout of that exact commit with independent dependencies, keeping other source/build writers out. Recheck HEAD and source bytes afterward, and compare every packaged dist file with the verified build; any mismatch invalidates the package. Keep the existing development preview on 4321 running. The release command requires Node, npm, Chromium, media-audit tools and Docker:

```sh
unset PORTFOLIO_DIST_ROOT
npm run package:release -- /path/to/private/release-output
```

This checks retained source, runs Astro diagnostics, builds the default `dist/`, audits it, then checks the production nginx image and runs the full browser suite against that image once. Each gate must pass. It packages `dist/`, Docker/nginx/Compose configuration, operator documentation and `release.json`; its Docker context admits only generated public files and nginx configuration. The runtime has no application server or content volume.

Set `PORTFOLIO_AUDIT_REPORT`, `PORTFOLIO_DEPLOYMENT_REPORT`, `PORTFOLIO_BROWSER_REPORT` and `PORTFOLIO_TEST_ARTIFACTS` to private report paths as needed. Inspect the exact generated archive and SHA-256 sidecar, rather than selecting an unrelated artifact by wildcard. Verify its checksum and `release.json`: the revision must identify the final commit, `workingTree` must be false, and `verified` must include retained source, Astro check, build, static audit, Docker smoke and the production nginx browser suite. Keep the full Git revision with the release record; metadata uses its 12-character abbreviation.

Use an annotated release tag with the established `v-` prefix, such as `v-2.1.0`, and an immutable corresponding image tag. Fetch/check tags immediately before creating the tag. Discover and recheck the remote default branch and ancestry before promoting the reviewed commit. For default branch `master`, the non-force flow is:

```sh
set -euo pipefail
git fetch origin --tags
release_commit=$(git rev-parse HEAD)
git merge-base --is-ancestor origin/master "$release_commit"
git status --short
# After reviewing the complete replacement scope and final verification:
git push origin "$release_commit":refs/heads/master
git tag -a v-2.1.0 "$release_commit" -m 'Release v-2.1.0: creative continuity and recorded Scratch Pad'
git push origin refs/tags/v-2.1.0
```

Substitute the reviewed release version and current default branch. A normal push rejects an incompatible concurrent remote change; do not force it. Recheck the resulting remote branch/tag targets. GitHub [selects workflow definitions from the event's commit/ref](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows#workflow-triggers); a [tag push](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#push) uses that tag's commit tree. This static source contains no hosted workflow files. A [`workflow_run`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_run) requires its definition on the default branch and a predecessor run. Check the exact release tree and queued/running jobs before and after pushing. There is no configured portfolio Hetzner webhook or deploy ledger: publishing uses the reviewed package manually. Do not dispatch a hosted deployment workflow.

## Stage the reviewed image on Hetzner

Transfer the exact archive and checksum to a new release directory. Never extract over the live operational directory. In the remote shell, set the reviewed release values; the archive and package names below are placeholders for the actual generated names:

```sh
set -euo pipefail
umask 077
release_tag=v-2.1.0
image_name="portfolio:$release_tag"
compose_project="portfolio-static-${release_tag//./-}"
stage_container="portfolio-stage-$release_tag"
saved_container="portfolio-app-before-$release_tag"
release_parent="/home/david/portfolio-releases/$release_tag"
backup_dir="/home/david/portfolio-backups/$release_tag"
# Both directories must be new for this release.
test ! -e "$release_parent"
test ! -e "$backup_dir"
install -d -m 700 "$release_parent" "$backup_dir"
```

Copy the reviewed archive and sidecar into `release_parent`, then continue there:

```sh
cd "$release_parent"
archive=portfolio-ACTUAL-PACKAGE-NAME.tar.gz
package_name=portfolio-ACTUAL-PACKAGE-NAME
sha256sum -c "$archive.sha256"
tar -tzf "$archive"
# Confirm one reviewed top-level package directory and no unexpected paths.
tar -xzf "$archive"
package_dir="$release_parent/$package_name"
cd "$package_dir"
cat release.json
cp release.json "$backup_dir/release.json"
printf '%s\n' "$image_name" > "$backup_dir/new-image-tag"
printf '%s\n' "$compose_project" > "$backup_dir/new-compose-project"
cp docker-compose.prod.yml "$backup_dir/new-compose.yml"
```

Check that `portfolio:$release_tag` and the stage/saved container names do not already exist before creating them. The Dockerfile pins the nginx base by digest. Build the image without pruning others; a long remote build must survive SSH disconnects and retain its exit result:

```sh
nohup bash -c '
  docker build -t "$1" "$2"
  result=$?
  printf "%s\n" "$result" > "$3"
  exit "$result"
' _ "$image_name" "$package_dir" "$backup_dir/build.exit" \
  >"$backup_dir/build.log" 2>&1 </dev/null &
```

Wait for `build.exit`, require `0`, and inspect the build log on failure. Record the built image ID, then stage it:

```sh
docker image inspect --format '{{.Id}}' "$image_name" > "$backup_dir/new-image-id"
docker run -d --name "$stage_container" \
  -p 127.0.0.1::8080 --read-only \
  --tmpfs /var/cache/nginx --tmpfs /var/run --tmpfs /tmp \
  --security-opt no-new-privileges:true "$image_name"
stage_port=$(docker inspect --format '{{(index (index .NetworkSettings.Ports "8080/tcp") 0).HostPort}}' "$stage_container")
printf '%s\n' "$stage_port"
docker exec "$stage_container" nginx -t
```

Docker assigns an unused loopback port. Port 8097 belongs to the ECC sandbox; preserve it. Do not stage on production 8091. Wait up to 100 seconds for stage health `healthy`, failing on `unhealthy`, `exited` or `dead`; the image checks every 30 seconds with a five-second start period and three retries. HTTP200 alone is insufficient.

Verify the stage using the HTTP/byte checks below. For browser checks, forward a free local port, such as 4399, to the discovered remote port with an owned `ssh -N -o ControlMaster=no -o ControlPath=none -L 127.0.0.1:4399:127.0.0.1:REMOTE_PORT hetzner` session. Keep local 4321 untouched. From the source checkout:

```sh
PORTFOLIO_TEST_URL=http://127.0.0.1:4399 \
PORTFOLIO_DIST_ROOT=/absolute/path/to/extracted/reviewed-package/dist \
node scripts/verify-browser-segments.mjs /private/release-staged-browser
```

`PORTFOLIO_TEST_URL` suppresses the runner's local preview and selects the staged server; `PORTFOLIO_PREVIEW_PORT` does not select a remote URL. No segment names means the full suite. Keep reports separate from local/package/public checks. Close only the owned tunnel afterward.

## Record and preserve the live release

Discover the live container's actual image, mounts and operational directory from selected inspect fields and its Compose labels. Do not assume the directory is a Git checkout or its release matches a cached local ref. Save full inspect records privately without printing environment values:

```sh
old_id=$(docker inspect --format '{{.Id}}' portfolio-app)
old_image=$(docker inspect --format '{{.Image}}' portfolio-app)
old_dir=$(docker inspect --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}' portfolio-app)
old_restart=$(docker inspect --format '{{.HostConfig.RestartPolicy.Name}}' portfolio-app)
old_retry_count=$(docker inspect --format '{{.HostConfig.RestartPolicy.MaximumRetryCount}}' portfolio-app)
if [ "$old_restart" = on-failure ] && [ "$old_retry_count" -gt 0 ]; then
  old_restart="$old_restart:$old_retry_count"
fi
test -d "$old_dir"
printf '%s\n' "$old_id" > "$backup_dir/old-container-id"
printf '%s\n' "$old_dir" > "$backup_dir/old-operational-directory"
printf '%s\n' "$old_restart" > "$backup_dir/old-restart-policy"
docker inspect portfolio-app > "$backup_dir/container.json"
docker image inspect "$old_image" > "$backup_dir/image.json"
# Require this backup image tag to be unused before adding it.
docker tag "$old_image" "portfolio:before-$release_tag"
```

If the working-directory label is missing or the recorded mounts have writers outside this container, resolve that before cutover. Retain the original directory and every original bind-mount path. Full inspect backups can contain credentials and remain under mode-700 `backup_dir`. An optional private `docker image save` provides another recovery copy. Check enough free disk for the release, retained image and operational-directory backup; do not prune.

Use a distinct Compose project for every release, as recorded above. A renamed saved container retains Compose labels; reusing its project/service could cause Compose to replace it. Save the current localhost/public route, redirect and health results as the rollback baseline.

## Cut over the authorized release

Finish staged checks first. Arm the state-aware rollback in a persistent executor before the first production stop, and retain it through public browser acceptance. Errors, interruptions, rejection or an acceptance timeout must invoke rollback; `set -e` alone only exits. The following block lists the cutover operations. Verify the live ID/image still match the saved observations, the saved-container name is unused and the new Compose project has no existing services. Stop/remove only this release's stage container; keep its image. From `package_dir`:

```sh
test "$(docker inspect --format '{{.Id}}' portfolio-app)" = "$old_id"
test "$(docker inspect --format '{{.Image}}' portfolio-app)" = "$old_image"
docker stop "$stage_container"
docker rm "$stage_container"
docker stop portfolio-app
cp -a "$old_dir" "$backup_dir/deployment-cold"
docker rename portfolio-app "$saved_container"
docker update --restart=no "$saved_container"
PORTFOLIO_IMAGE="$image_name" \
  docker compose -p "$compose_project" -f docker-compose.prod.yml up -d
```

For the current static runtime, this copies retained package material after the old container stops; the served files remain baked into its preserved image. If replacing an older mutable application, a coherent cold database copy additionally requires every writer to be stopped. The original files and mounts remain in place. The saved container's restart policy is set to `no` so a Docker/host restart cannot reactivate its port 8091 listener; its exact original policy is recorded for rollback. Keep its ports, environment, mounts and startup command. No migrations or application-data changes are part of this release.

On any failure after stopping the old application, run the state-aware rollback below immediately. Leave host nginx unchanged. Wait for the new container to become healthy within the bounded health window; record its ID/image and verify the built image ID matches the staged one and its published port is only `127.0.0.1:8091`.

## Verify staged and public delivery

Run the same checks against the stage, `http://127.0.0.1:8091`, and `https://danishdave.com`. Save safe statuses, selected headers, byte counts and hashes; avoid printing cookies or complete response headers.

- Enumerate all built HTML routes from packaged `dist/`; require HTTP200 and the expected headings. Check custom missing-page content with HTTP404. `/en`, `/en/`, `/da`, `/da/` must return HTTP301 with exactly `Location: /`, without internal ports or loops. `/src/data/projects.ts`, `/package.json`, `/.env` and `/docs/publishing.md` must return 404.
- GET each built CSS/JS asset and compare its SHA-256 with the packaged file. HEAD all packaged media/downloads for HTTP200 and exact byte length. Compare the newest recordings/captures, original generated images and selected-work PDF with their packaged hashes. Retain the reviewed PNG/JPEG/PDF/PPTX bytes and correct MIME types.
- Require page security headers (`nosniff`, `strict-origin-when-cross-origin`, `SAMEORIGIN`), immutable one-year caching for hashed `/_astro/` assets and one-hour media caching. Inspect effective behavior if host nginx adds headers.
- Request `Range: bytes=0-1023` for a reviewed MP4 and the WAV sample. Require HTTP206, 1024 bytes and `Content-Range: bytes 0-1023/TOTAL`, with the packaged total length and MIME. Compare those bytes with the package and test an interior/tail video range for seeking. WAV starts with `RIFF`; VTT uses `text/vtt` and starts with `WEBVTT`. Exercise the newest showcase films and their native captions too.
- Require sitemap/robots HTTP200 and the public origin. Check HTTP-to-HTTPS redirect and the `www.danishdave.com` and `portfolio.danishdave.com` routes. Host nginx uses `localhost`; public checks must validate the new IPv4-loopback listener through that actual upstream.
- In a browser, inspect home, case studies and the newest feature stories at phone/tablet/desktop widths. Play and seek captioned recordings, check opt-in/paused startup and pause-on-close behavior, and download the selected-work PDF. Use a separate `PORTFOLIO_TEST_URL=https://danishdave.com` segmented run for public browser evidence.

For an exact byte-range comparison, use a private output file and fail on every mismatch. Set `base_url` to the stage, localhost or public base, and keep a separate header/body file per check:

```sh
base_url=https://danishdave.com
media_path=media/pencil-page-workflow.mp4
http_code=$(curl -fsS -H 'Range: bytes=0-1023' \
  -D "$backup_dir/range.headers" -o "$backup_dir/range.bin" \
  -w '%{http_code}' "$base_url/$media_path")
test "$http_code" = 206
test "$(wc -c < "$backup_dir/range.bin")" -eq 1024
cmp "$backup_dir/range.bin" <(head -c 1024 "$package_dir/dist/$media_path")
```

Also assert `Content-Range` and MIME from the saved headers as described above. A successful curl exit alone does not establish the expected status, redirect or bytes. Record the final tag/full commit, archive hash, image ID, container IDs, health, safe HTTP/hash outcomes and public browser results privately. Keep the saved old container, image and cold directory backup until acceptance.

## Roll back on any cutover or public-check failure

Read this release's recorded values if opening a fresh shell: its new image tag, unique Compose project, original container ID/restart policy and saved-container name. Use the exact recorded project and Compose file; never run an unrelated operational directory's Compose down command.

If stop succeeded but the cold copy or rename failed, the original container may still be named `portfolio-app`. Check that exact identity before starting it. If the rename succeeded, remove only this release's new Compose service and restore the preserved container:

```sh
old_id=$(cat "$backup_dir/old-container-id")
old_restart=$(cat "$backup_dir/old-restart-policy")
if docker inspect "$saved_container" >/dev/null 2>&1; then
  test "$(docker inspect --format '{{.Id}}' "$saved_container")" = "$old_id"
  PORTFOLIO_IMAGE="$image_name" \
    docker compose -p "$compose_project" -f "$backup_dir/new-compose.yml" down
  docker rename "$saved_container" portfolio-app
  docker update --restart="$old_restart" portfolio-app
  docker start portfolio-app
else
  test "$(docker inspect --format '{{.Id}}' portfolio-app)" = "$old_id"
  docker update --restart="$old_restart" portfolio-app
  docker start portfolio-app
fi
```

Run these with failure-stop behavior: if Compose down or an identity check fails, inspect the recorded new container ID/labels and stop/remove only that new service before renaming the saved one. Never remove the saved container. Verify the restored image ID, original port bindings and recorded route/redirect/health baseline locally and publicly. Its original mount paths still contain the preserved operational data. The retained backup image and cold directory copy provide a second recovery path; restoring those files is unnecessary for a container rollback that leaves the originals untouched.
