const GOOGLE_WEB_CLIENT_ID = "1041559334890-ij42cmc214hjiljr68pnvkm7fc0m5qop.apps.googleusercontent.com";

let scriptReadyPromise: Promise<void> | null = null;

function waitForGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();

  if (!scriptReadyPromise) {
    scriptReadyPromise = new Promise((resolve, reject) => {
      const check = () => {
        if (window.google?.accounts?.oauth2) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
      setTimeout(() => reject(new Error("google-identity-load-timeout")), 10000);
    });
  }

  return scriptReadyPromise;
}

export async function requestGoogleAccessToken(): Promise<string> {
  await waitForGoogleIdentityServices();

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_WEB_CLIENT_ID,
      scope: "openid email profile",
      callback: (response) => {
        if (response.error) {
          reject({ code: `gis/${response.error}` });
          return;
        }
        if (!response.access_token) {
          reject({ code: "gis/no-access-token" });
          return;
        }
        resolve(response.access_token);
      },
    });

    client.requestAccessToken();
  });
}