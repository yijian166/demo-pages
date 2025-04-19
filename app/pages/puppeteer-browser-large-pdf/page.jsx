import { LineChat } from '@components/chats/line-chat';
import { loadData } from '@components/chats/files';
import { Suspense } from 'react';
export const dynamic = 'force-dynamic';
export default function PuppeteerBrowserLargePdfPage(props) {
  const data = loadData(true);
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <LineChat data={data} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

export const metadata = {
  title:
    'Puppeteer Browser: Render Small PDFs Separately and Merge into Large PDF - Performance Measurement | Hip Log',
  description:
    'Measure the performance of rendering multiple small PDFs using Puppeteer in separate chunks, then merging the rendered pages into a single PDF document.',
};
