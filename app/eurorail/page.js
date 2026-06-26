import EurorailClient from './EurorailClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Book European Train Tickets & Eurail Passes | Euro Rails',
  description:
    'Plan your European train journeys. Book high-speed train tickets and Eurail passes for France, Switzerland, Italy, Germany, and beyond with 24/7 support.',
  keywords:
    'Euro Rails, Eurail pass, European train tickets, book TGV tickets, ICE trains Europe, Switzerland train pass, scenic rail Europe',
};

export default function EurorailPage() {
  return <EurorailClient />;
}
