'use client';
import { useEffect, use, useState, useDeferredValue, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, // X 轴
  LinearScale, // Y 轴
  PointElement, // 点
  LineElement, // 线
  Title, // 标题
  Tooltip, // 提示
  Legend, // 图例
} from 'chart.js';
import { Line } from 'react-chartjs-2'; // 导入 Line 图表类型
import Annotation from 'chartjs-plugin-annotation';

// *** 核心步骤：注册需要用到的模块 ***
// Chart.js v3+ 需要手动注册你需要的组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Annotation
);
const toLabel = (timeStamp) => {
  const date = new Date(timeStamp);
  const m = date.getMinutes();
  const s = date.getSeconds();
  const ms = date.getMilliseconds();
  return `${m}:${s <= 9 ? '0' + s : s}`;
};

const toXList = (list) => {
  const timeSet = list.reduce((pre, cur) => {
    cur.forEach((item) => {
      pre.add(item[0]);
    });
    return pre;
  }, new Set());
  const timeList = Array.from(timeSet).sort((a, b) => a - b);
  return timeList;
};

// 配置选项
const getOptions = (list, isCpu = true) => {
  const timeList = toXList(list);
  return {
    responsive: true, // 图表是否响应式，自适应容器大小
    maintainAspectRatio: false, // 保持宽高比，通常设为 false 以便自定义高度
    plugins: {
      legend: {
        position: 'bottom', // 图例显示在底部
      },
      title: {
        display: true, // 显示标题
        text: isCpu ? 'CPU Usage' : 'Memory Usage', // 标题文本
      },
      tooltip: {
        mode: 'index', // 鼠标悬停时显示所有数据集在该索引上的数据
        intersect: false,
      },
      // 3. 配置注释
      annotation1: {
        annotations: {
          ...list.reduce((pre, cur, index) => {
            const item = cur.find((item) => item[5] === 'js');
            const idx = timeList.findIndex((x) => x === item[0]);
            const y = isCpu ? item[2] : item[3];
            // console.log(
            //   'sss',
            //   idx,
            //   isCpu ? 'CPU' : 'Memory',
            //   item,
            //   toLabel(item[0]),
            //   y
            // );
            return {
              ...pre,
              [`point_${index}`]: {
                type: 'point',
                xValue: idx,
                yValue: y,
                backgroundColor: 'rgba(255, 99, 132, 0.25)',
                radius: 6,
              },
            };
          }, {}),

          // 可以定义多个注释，给每个注释一个唯一的 key (例如 'verticalLine1')
          // verticalLine1: {
          //   type: 'line1', // 注释类型为 'line'
          //   // xScaleID: 'x', // 关联到 ID 为 'x' 的 X 轴
          //   // xMin: '1:33', // 对于 CategoryScale，通常用 value
          //   // xMax: '1:33', // 对于 CategoryScale，通常用 value
          //   // xValue: '1:33', // 要绘制垂直线的 X 轴值 (与 labels 中的值对应)
          //   // yScaleID: 'y', // (可选) 关联到 Y 轴，让线条自动撑满 Y 轴高度
          //   // yMin: 0, // 可以手动指定 Y 轴的起始值
          //   // yMax: 100, // 可以手动指定 Y 轴的结束值 (如果 yScaleID 未设置或想限制范围)
          //   // yValue: 50, // 要绘制垂直线的 Y 轴值
          //   // --- 样式配置 ---
          //   borderColor: 'red', // 线条颜色
          //   borderWidth: 2, // 线条宽度
          //   // borderDash: [6, 6], // 设置为虚线 (6像素线段, 6像素空白)

          //   // --- (可选) 添加标签 ---
          //   label: {
          //     content: '重要节点', // 标签文本
          //     enabled: true, // 显示标签
          //     position: 'start', // 标签位置 ('start', 'center', 'end')
          //     backgroundColor: 'rgba(255, 0, 0, 0.7)', // 标签背景色
          //     font: {
          //       size: 10,
          //     },
          //     yAdjust: -10, // 向上微调标签位置
          //   },
          // },
          // 你可以在这里添加更多的注释对象，例如:
          // verticalLine2: { type: 'line', xValue: '六月', borderColor: 'green', ... }
        },
      },
    },
    scales: {
      // 配置坐标轴
      y: {
        beginAtZero: true, // Y 轴从 0 开始
        title: {
          display: true,
          text: isCpu ? '%' : 'GiB',
        },
      },
      x: {
        title: {
          display: false,
          text: 'Time',
        },
      },
    },
    interaction: {
      // 交互设置
      mode: 'nearest', // 最近的数据点高亮
      axis: 'x',
      intersect: false,
    },
  };
};
const generateData = (list, isCpu, sameColor = true) => {
  const timeList = toXList(list);
  const isAll = list.length >= 4;
  const getDataSet = (sList, type) => {
    const isChrome = sList[0][1].endsWith('chrome');
    const isFull = sList[0][1].startsWith('full');
    let lineOp = 0.9;
    let dotOp = 0.5;
    if (type === 'BEFORE' || type === 'FINISHED_OK') {
      lineOp = 0.3;
      dotOp = 0.1;
    }

    let borderColor;
    let backgroundColor;
    if (isChrome) {
      borderColor =
        isCpu || sameColor
          ? `rgba(255, 99, 132, ${lineOp})`
          : `rgba(255, 159, 64, ${lineOp})`;
      backgroundColor =
        isCpu || sameColor
          ? `rgba(255, 99, 132, ${dotOp})`
          : `rgba(255, 159, 64, ${dotOp})`;
    } else {
      borderColor =
        isCpu || sameColor
          ? `rgba(53, 162, 235, ${lineOp})`
          : `rgba(75, 192, 192, ${lineOp})`;
      backgroundColor = borderColor =
        isCpu || sameColor
          ? `rgba(53, 162, 235, ${dotOp})`
          : `rgba(75, 192, 192, ${dotOp})`;
    }
    let data = timeList.map((item) => {
      let value = sList.find(([time]) => time === item);
      return value ? Number(value[isCpu ? 2 : 3]) : null;
    });
    return {
      label:
        (isChrome ? 'Chrome' : 'Firefox') +
        `${isAll ? (isFull ? ' Full' : ' Merge') : ''} ` +
        ` (${type})`, // 第一条线的标签
      data, // 数据点
      borderColor, // 线条颜色
      backgroundColor, // 点/填充色（可选）
      tension: 0.4, // 线条的弯曲度 (0 表示直线)
      spanGaps: true,
      borderWidth: isFull && isAll ? 1 : 2, // 设置线条宽度为 1 像素
      pointRadius: isFull && isAll ? 1.2 : 2.4, // 设置数据点半径为 8 像素
      // // 鼠标悬停时的半径
      // pointHoverRadius: 4, //鼠标悬停时，半径变为 12像素
      ...(isFull && isAll ? { borderDash: [5, 5] } : {}),
    };
  };
  const datasets = list.reduce((pre, cur) => {
    const duringList = cur.filter((item) => item[4] === 'DURING');
    pre.push(
      getDataSet(
        [...cur.filter((item) => item[4] === 'BEFORE'), duringList[0]],
        'BEFORE'
      )
    );
    pre.push(getDataSet(duringList, 'DURING'));
    pre.push(
      getDataSet(
        [
          duringList[duringList.length - 1],
          ...cur.filter((item) => item[4] === 'FINISHED_OK'),
        ],
        'FINISHED_OK'
      )
    );
    return pre;
  }, []);

  // 准备图表数据
  const data = {
    // X 轴的标签
    labels: timeList.map((item) => toLabel(item)),
    datasets,
  };

  // console.log('sss', data);
  return data;
};

const filterDataByMode = (originalList, lazyMode) => {
  if (lazyMode === 'all') {
    return originalList;
  }

  return originalList
    .map((group) => {
      return group.filter((item) => {
        const isFull = lazyMode === 'full' && item[1].startsWith('full');
        const isNoFull = lazyMode === 'nofull' && !item[1].startsWith('full');
        return isFull || isNoFull;
      });
    })
    .filter((item) => item.length > 0);
};

export function LineChat({ data, searchParams: serverSearchParams }) {
  const list = use(data);
  const searchParams = use(serverSearchParams);
  const serverDisplayMode = searchParams.mode || 'all';

  const [displayMode, setDisplayMode] = useState(serverDisplayMode);
  const lazyMode = useDeferredValue(displayMode);

  // 根据选择的模式过滤数据

  const filteredList = useMemo(
    () => filterDataByMode(list, lazyMode),
    [list, lazyMode]
  );

  // 处理单选按钮变化
  const handleModeChange = (e) => {
    setDisplayMode(e.target.value);
    window.history.pushState(null, '', `?mode=${e.target.value}`);
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            justifyContent: 'center',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--font-color)',
            }}
          >
            <input
              type="radio"
              name="displayMode"
              value="all"
              checked={displayMode === 'all'}
              onChange={handleModeChange}
            />
            All
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--font-color)',
            }}
          >
            <input
              type="radio"
              name="displayMode"
              value="full"
              checked={displayMode === 'full'}
              onChange={handleModeChange}
            />
            Full
          </label>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: 'var(--font-color)',
            }}
          >
            <input
              type="radio"
              name="displayMode"
              value="nofull"
              checked={displayMode === 'nofull'}
              onChange={handleModeChange}
            />
            Merge
          </label>
        </div>
      </div>
      <div style={{ position: 'relative', height: '600px', width: '100%' }}>
        {/* 使用 Line 组件绘制折线图 */}
        <Line
          options={getOptions(filteredList)}
          data={generateData(filteredList, true)}
        />
      </div>
      <div
        style={{
          position: 'relative',
          height: '600px',
          width: '100%',
          marginTop: 40,
        }}
      >
        {/* 使用 Line 组件绘制折线图 */}
        <Line
          options={getOptions(filteredList, false)}
          data={generateData(filteredList, false)}
        />
      </div>
    </div>
  );
}
