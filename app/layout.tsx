import { Fraunces, Anton, Bagel_Fat_One, Parisienne, Permanent_Marker } from 'next/font/google';
import './globals.css';

// Every card template pulls its type from one of these five families,
// each exposed as a CSS variable so InviteCard never has to load a font
// itself. Keeping it to five (rather than one per template) keeps page
// weight down while still giving each template a distinct voice:
//  --font-serif   quiet editorial serif (editorial, photo)
//  --font-display condensed bold caps (poster/letterpress-arch/ticket/scatter)
//  --font-round   chunky rounded bubble caps (bubble-doodle)
//  --font-script  cursive (cursive-announce)
//  --font-marker  thick uneven marker-pen caps (bold-marker)
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display', display: 'swap' });
const bagel = Bagel_Fat_One({ subsets: ['latin'], weight: '400', variable: '--font-round', display: 'swap' });
const parisienne = Parisienne({ subsets: ['latin'], weight: '400', variable: '--font-script', display: 'swap' });
const marker = Permanent_Marker({ subsets: ['latin'], weight: '400', variable: '--font-marker', display: 'swap' });

export const metadata = {
  title: 'LiteInvite',
  description: 'Send invites, track RSVPs, send thank yous. That\'s it.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${anton.variable} ${bagel.variable} ${parisienne.variable} ${marker.variable}`}>
      <body>{children}</body>
    </html>
  );
}
