/**
 * Terms of Service and Privacy Policy content, shared by the in-app legal
 * screens (app/legal/[doc].tsx), the locsapp.net pages and the docs/ Markdown.
 * Edit here only: `npm run web:build` regenerates the website and docs/ from
 * this file.
 */

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDoc = {
  title: string;
  sections: LegalSection[];
};

export const LEGAL_EFFECTIVE_DATE = "September 25, 2026";

export const LEGAL_CONTACT_EMAIL = "locsapp.app@gmail.com";

export const TERMS_OF_SERVICE: LegalDoc = {
  title: "Terms of Service",
  sections: [
    {
      heading: "1. Agreement",
      paragraphs: [
        `These Terms of Service ("Terms") govern your use of Locs (the "App"), a social app for making predictions on questions your friends and other users post, staking virtual coins on outcomes, and cosmetically customising your profile. By creating an account you agree to these Terms and to our Privacy Policy.`,
      ],
    },
    {
      heading: "2. Eligibility",
      paragraphs: [
        "You must be at least 18 years old, or the age of majority where you live if that is older, to create an account or use the App. By creating an account you confirm that you meet this requirement. We may close accounts we believe belong to someone under this age.",
        "You are responsible for making sure use of the App complies with the laws that apply to you.",
      ],
    },
    {
      heading: "3. Your account",
      paragraphs: [
        "You need an account to use the App. You agree to provide accurate information, keep your login credentials confidential, and let us know if you believe your account has been compromised.",
        "You are responsible for activity that happens under your account.",
      ],
    },
    {
      heading: "4. Virtual coins are not money",
      paragraphs: [
        "Coins are a virtual, in-app scorekeeping and cosmetic-purchase mechanic. Coins have no monetary value, cannot be purchased with real money, cannot be sold, transferred, redeemed, or exchanged for cash, cryptocurrency, goods, or anything of real-world value, and exist only inside the App.",
        "Because coins cannot be cashed out or bought with real money, staking coins on an event's outcome is not gambling, wagering, or a game of chance for money or anything of value — it's a prediction game played with points. We may adjust, reset, or award coin balances at any time, including to correct errors or abuse.",
        "Coins are used to unlock cosmetic avatars in the in-app shop. Cosmetic purchases have no resale value and cannot be exchanged back into coins.",
      ],
    },
    {
      heading: "5. Events, predictions, and payouts",
      paragraphs: [
        "Any user can create an event with a question and possible outcomes. Other users may stake coins on an outcome before the event locks. The event's creator is responsible for deciding the outcome once it is resolvable, and coin pots pay out to participants based on that decision.",
        "Because outcomes are decided by the event's creator rather than an independent authority, use good judgment about which events and creators you trust, and understand that decisions are final once recorded. We are not a party to any event and do not guarantee that a creator will decide fairly, promptly, or at all.",
      ],
    },
    {
      heading: "6. Content you post",
      paragraphs: [
        'You keep ownership of the events, questions, images, and other content you post ("User Content"), but you grant us a worldwide, royalty-free licence to host, store, reproduce, and display it as needed to operate and improve the App.',
        "You are solely responsible for your User Content. Don't post anything that is illegal, harassing, hateful, sexually explicit, violent, infringing, or that impersonates someone else, and only upload images you have the right to share.",
        "We may remove or restrict User Content, and may suspend or terminate accounts, that we believe in good faith violates these Terms, the law, or puts other users at risk — with or without notice.",
      ],
    },
    {
      heading: "7. Prohibited conduct",
      paragraphs: [
        "You agree not to: use the App to harass, threaten, or bully anyone; attempt to manipulate events, coin balances, or the shop through cheating, exploiting bugs, or multiple accounts; scrape, reverse engineer, or interfere with the App's normal operation; misrepresent your identity or age; or use the App for any unlawful purpose.",
      ],
    },
    {
      heading: "8. Suspension and termination",
      paragraphs: [
        "We may suspend or terminate your access to the App if you violate these Terms or if we reasonably believe doing so is needed to protect the App or other users.",
        "You can delete your account at any time from Settings. Deleting your account permanently removes your profile, events, bets, coins, and owned avatars, and refunds coins that other users had staked on your still-open events. This cannot be undone.",
      ],
    },
    {
      heading: "9. Disclaimers",
      paragraphs: [
        `The App is provided "as is" and "as available," without warranties of any kind, whether express or implied, including any warranty of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee the App will be uninterrupted, error-free, or secure, or that any user-decided event outcome will be accurate or fair.`,
      ],
    },
    {
      heading: "10. Limitation of liability",
      paragraphs: [
        "To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of data, goodwill, or virtual coins, arising from your use of the App. Because coins have no monetary value, no claim may be based on their loss or on any event's outcome.",
      ],
    },
    {
      heading: "11. Changes to these Terms",
      paragraphs: [
        "We may update these Terms from time to time. If we make material changes, we'll let you know in the App before they take effect. Continuing to use the App after changes take effect means you accept the updated Terms.",
      ],
    },
    {
      heading: "12. Contact",
      paragraphs: [`Questions about these Terms? Reach us at ${LEGAL_CONTACT_EMAIL}.`],
    },
  ],
};

export const PRIVACY_POLICY: LegalDoc = {
  title: "Privacy Policy",
  sections: [
    {
      heading: "1. Overview",
      paragraphs: [
        "This Privacy Policy explains what information Locs (the \"App\") collects, how we use it, and the choices you have. We built the App to run on as little personal data as possible — no ads, no data selling, no cross-app tracking.",
      ],
    },
    {
      heading: "2. Information we collect",
      paragraphs: [
        "Account information: your email address, username, and password (handled by our authentication provider — we never see your password in plain text). If you sign in with Google or Apple, we receive the identifier and email those providers share with us.",
        "Content you create: events, questions, images you upload, and other content you choose to post.",
        "Activity data: the bets you place, coins you earn or spend, events you create or join, and the accounts you follow or that follow you.",
        "Device and technical data: your device's platform (iOS/Android/web) and a push-notification token, if you enable notifications, so we can deliver them to your device.",
      ],
    },
    {
      heading: "3. How we use this information",
      paragraphs: [
        "To create and maintain your account, operate events, bets, and the coin economy, show you content from people you follow, send push notifications you've enabled, keep the App secure, and improve how it works.",
        "We do not use your information for advertising, and we do not build advertising or tracking profiles about you.",
      ],
    },
    {
      heading: "4. Who we share it with",
      paragraphs: [
        "We use a small number of service providers to run the App, and share only what each needs to do its job:",
        "• Supabase — hosts our database, authentication, and file storage (including uploaded images).",
        "• Expo's push notification service — delivers push notifications to your device using your device's push token.",
        "• Google and Apple — process sign-in when you choose to continue with Google or Apple.",
        "We do not sell your personal information, and we do not share it with third parties for their own advertising purposes.",
      ],
    },
    {
      heading: "5. Data retention and deletion",
      paragraphs: [
        "We keep your account information for as long as your account exists. You can permanently delete your account at any time from Settings; this removes your profile, events, bets, coin balance, and owned avatars, and refunds coins staked on your still-open events by others. If you can no longer use the App, email us from the address on your account and we will delete it for you.",
        "Some uploaded images (such as event thumbnails) may briefly persist in storage or backups for a short period after deletion before being fully purged.",
      ],
    },
    {
      heading: "6. Children",
      paragraphs: [
        "The App is intended only for adults aged 18 or over (or the age of majority where you live, if higher). We do not knowingly collect personal information from anyone under that age; if we learn that we have, we will delete the account and its data.",
      ],
    },
    {
      heading: "7. Security",
      paragraphs: [
        "We use reasonable technical and organisational measures to protect your information, including encrypted storage of credentials by our authentication provider. No method of storage or transmission is completely secure, and we can't guarantee absolute security.",
      ],
    },
    {
      heading: "8. Your rights",
      paragraphs: [
        "Depending on where you live, you may have rights to access, correct, or delete your personal information (for example, under the GDPR or the CCPA). You can access and delete most of your information directly in the App; for anything else, contact us using the details below.",
      ],
    },
    {
      heading: "9. Changes to this policy",
      paragraphs: [
        "We may update this Privacy Policy from time to time. If we make material changes, we'll let you know in the App before they take effect.",
      ],
    },
    {
      heading: "10. Contact",
      paragraphs: [`Questions about this policy or your data? Reach us at ${LEGAL_CONTACT_EMAIL}.`],
    },
  ],
};
