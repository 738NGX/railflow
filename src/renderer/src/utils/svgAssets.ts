// SVG 资源导入文件
// 使用 Vite 的静态资源导入功能

import DownStairsUrl from '../themes/E235-0/SVG/DownStairs.svg?url';
import UpStairsUrl from '../themes/E235-0/SVG/UpStairs.svg?url';
import ElevatorUrl from '../themes/E235-0/SVG/Elevator.svg?url';
import DownEscalatorUrl from '../themes/E235-0/SVG/DownEscalator.svg?url';
import UpEscalatorUrl from '../themes/E235-0/SVG/UpEscalator.svg?url';
import PrioritySeatUrl from '../themes/E235-0/SVG/PrioritySeat.svg?url';
import MobilePhoneUrl from '../themes/E235-0/SVG/MobilePhone.svg?url';

export const SVG_ASSETS = {
  downStairs: DownStairsUrl,
  upStairs: UpStairsUrl,
  elevator: ElevatorUrl,
  downEscalator: DownEscalatorUrl,
  upEscalator: UpEscalatorUrl,
  prioritySeat: PrioritySeatUrl,
  mobilePhone: MobilePhoneUrl
};

export const SVG_ASSETS_ARRAY = [
  { path: 'downStairs', url: DownStairsUrl, key: 'downStairs' },
  { path: 'upStairs', url: UpStairsUrl, key: 'upStairs' },
  { path: 'elevator', url: ElevatorUrl, key: 'elevator' },
  { path: 'downEscalator', url: DownEscalatorUrl, key: 'downEscalator' },
  { path: 'upEscalator', url: UpEscalatorUrl, key: 'upEscalator' },
  { path: 'prioritySeat', url: PrioritySeatUrl, key: 'prioritySeat' },
  { path: 'mobilePhone', url: MobilePhoneUrl, key: 'mobilePhone' }
];
