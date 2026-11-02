import { openAuthentication } from '../auth-package/packages/curation-review-app/shared/authentication';
import { uploadSubmission } from '../auth-package/packages/curation-review-app/shared/submission';
declare const __SOURCE__: string;
const repository = 'leej3/orinoco-lite-submodule-demo';
const button = document.querySelector<HTMLButtonElement>('#run')!;
const status = document.querySelector<HTMLPreElement>('#status')!;
const link = document.querySelector<HTMLAnchorElement>('#workflow')!;
button.addEventListener('click', async () => {
  button.disabled = true;
  status.textContent = 'Signing in…';
  const authentication = openAuthentication({ repository, kind: 'shacl', service_origin: 'https://orinoco-issue-249-test.pages.dev' });
  try {
    const { login } = await authentication.ready;
    status.textContent = `Signed in as ${login}. Checking repository credentials…`;
    const access = await authentication.credentials(__SOURCE__);
    const token = access.credentials[repository].token;
    const artifacts = await fetch(`https://api.github.com/repos/${repository}/actions/artifacts?per_page=1`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }, credentials: 'omit',
    }).then(async (response) => response.ok ? response.json() : { artifacts: [] });
    let artifactResult = 'No current artifact to test.';
    if (artifacts.artifacts?.[0]) {
      try {
        const archive = await fetch(`https://api.github.com/repos/${repository}/actions/artifacts/${artifacts.artifacts[0].id}/zip`, {
          headers: { Authorization: `Bearer ${token}` }, credentials: 'omit', redirect: 'follow',
        });
        artifactResult = archive.ok ? `Artifact download: ${(await archive.arrayBuffer()).byteLength} bytes.` : `Artifact download HTTP ${archive.status}.`;
      } catch { artifactResult = 'Artifact download blocked by browser transport; investigate CORS.'; }
    }
    status.textContent = 'Uploading the fixture directly to the metadata repository…';
    const result = await uploadSubmission({ format: 'orinoco-authentication-probe', version: 1, source_commit: __SOURCE__, fixture: 'fixture-data-'.repeat(100000) }, access, authentication);
    link.href = result.workflow_url;
    link.hidden = false;
    status.textContent = `Signed in as ${login}.\nRepository scopes: ${access.scope.repositories.map((repo) => repo.name).join(', ')}\nToken expiries: ${Object.values(access.credentials).map((credential) => credential.expires_at).join(', ')}\n${artifactResult}\nUploaded input: ${result.input_commit}\nInput repository: ${result.repository}\nWorkflow dispatched. Browser tokens will be revoked now.`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'The authentication test failed.';
  } finally {
    await authentication.release().catch(() => undefined);
    button.disabled = false;
  }
});
