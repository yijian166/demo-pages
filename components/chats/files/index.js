import { list as blobList } from '@vercel/blob';
const fetchData = async (urlList,csvName = 'full-chrome') => {
  const data = await fetch(urlList.find((item) => item.pathname.endsWith(`${csvName}.csv`)).downloadUrl).then((res) => res.text());
  
  const [, ...list] = data.split('\n').filter(Boolean);
  const newList = [];
  let tempList = [];
  list.forEach((item) => {
    const [time, cpu, mem, memUnit, phase, ...list] = item.split(',');
    if (memUnit !== 'MiB' && memUnit !== 'GiB') {
      console.log(`Invalid memory unit: ${memUnit}`);
      throw new Error(`Invalid memory unit: ${memUnit}`);
    }
    const timestamp = new Date(time).getTime();
    const newItem = [
      timestamp,
      csvName,
      Number(cpu),
      memUnit === 'MiB' ? Number(mem) / 1024 : Number(mem),
      phase,
      ...list,
    ];

    function insert() {
      if (tempList.length === 0) return;
      newList.push([
        tempList[tempList.length - 1][0],
        tempList[tempList.length - 1][1],
        tempList.reduce((pre, cur) => pre + cur[2], 0) / tempList.length,
        tempList.reduce((pre, cur) => pre + cur[3], 0) / tempList.length,
        tempList[tempList.length - 1][4],
        tempList.find((item) => !!item[5])?.[5] || '',
      ]);
      tempList = [];
    }
    if (phase === 'DURING') {
      if (tempList.length === 0 || timestamp < tempList[0][0] + 1000 * 10) {
        tempList.push(newItem);
      } else {
        insert();
        tempList.push(newItem);
      }
    } else {
      insert();
      tempList.push(newItem);
    }
  });
  return newList;
};

export async function loadData() {
  const { blobs } = await blobList({
    prefix: `puppeteer`,
    // mode: 'folded',
  });
  const [chrome, firefox, nfChrome, nfFirefox] = await Promise.all([
    fetchData(blobs, 'full-chrome'),
    fetchData(blobs, 'full-firefox'),
    fetchData(blobs, 'nofull-chrome'),
    fetchData(blobs, 'nofull-firefox'),
  ]);
  const min = Math.min(
    chrome[0][0],
    firefox[0][0],
    nfChrome[0][0],
    nfFirefox[0][0]
  );
  const handle = (list, abs) =>
    list.map((line) => line.map((v, i) => (i === 0 ? v - abs : v)));
  return [
    chrome[0][0] > min ? handle(chrome, chrome[0][0] - min) : chrome,
    firefox[0][0] > min ? handle(firefox, firefox[0][0] - min) : firefox,
    nfChrome[0][0] > min ? handle(nfChrome, nfChrome[0][0] - min) : nfChrome,
    nfFirefox[0][0] > min
      ? handle(nfFirefox, nfFirefox[0][0] - min)
      : nfFirefox,
  ];
}
