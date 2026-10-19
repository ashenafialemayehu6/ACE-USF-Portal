# ACE-USF Live Meeting setup

The website and secure token endpoint are prepared for LiveKit audio meetings. A room becomes usable after LiveKit credentials are added to the Vercel project and the website/backend are deployed.

## 1. Create LiveKit credentials

1. Create a LiveKit Cloud account and a project at [cloud.livekit.io](https://cloud.livekit.io/).
2. Open the project’s **Settings / Keys** page.
3. Copy its server URL, API key, and API secret. The URL usually begins with `wss://`.
4. Keep the API secret private. Do not put it in website JavaScript or send it in chat.

## 2. Add three Vercel environment variables

In the Vercel project **ace-usf-telegram-webhook**, open **Settings → Environment Variables** and add these for **Production**:

| Name | Value |
| --- | --- |
| `LIVEKIT_URL` | LiveKit project server URL (`wss://…`) |
| `LIVEKIT_API_KEY` | LiveKit project API key |
| `LIVEKIT_API_SECRET` | LiveKit project API secret |

Save each value. Then open PowerShell in `ACE-USF-TELEGRAM-VERCEL` and run:

```powershell
npm.cmd install
vercel.cmd --prod
```

This deploys the meeting token endpoint while retaining the Telegram webhook.

## 3. Deploy the website

Open a separate terminal at the website project root (`ACE-USF-Portal-main`) and deploy Hosting only:

```powershell
firebase.cmd deploy --only hosting
```

## 4. Publish a live Bible study

1. Sign in to the website as its administrator and open **Admin → Meeting Room programs**.
2. Create or edit a meeting. Choose **Online** or **Hybrid**.
3. Choose its audience and fill in the normal meeting details.
4. Turn on **Enable the ACE-USF live audio room**.
5. Enter the designated leader’s Firebase Authentication UID in **Live audio leader Firebase UID (private)**. Add that leader in **Meeting Room membership access** first and approve the membership. Keep the UID private.
6. Save and publish the program.

Eligible attendees can listen, raise a hand, and send typed questions. The designated leader can turn on their microphone. Room access and leader permissions are checked by the server for each connection.

## Cost note

LiveKit’s free Build plan has a monthly participant-minute allowance and concurrency/data limits. Each person connected consumes participant minutes, including listeners. Review the current [LiveKit pricing page](https://livekit.com/pricing) before hosting a long or large meeting; free service is not unlimited.
