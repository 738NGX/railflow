# Railflow

目标是完成JR风格的自定义线路图、站牌、LCD功能合集。

## 项目配置文件

存储目录：Documents/RailFlow/${project_id}

目前计划包含文件:

### project.json 基本信息配置

```json
{
  "id": "c0d2f71b-5d14-483a-998f-49a7a214dc91",	 // 项目ID
  "name": "JR East",							// 项目名称
  "createdAt": "2025-07-27T07:08:41.636Z"		// 项目创建时间
  "savedAt": "2025-07-27T07:08:41.636Z"			// 项目最后保存时间
}
```

### lines.json 线路配置

### stations.json 车站配置

```json
[
  {
    "id": 0,
    "update": {
      "year": 2015,
      "month": 9
    },
    "name": {
      "kanji": "東京",
      "hiragana": "とうきょう",
      "english": "Tōkyō",
      "chinese": "东京",
      "korean": "도쿄",
      "code": "TYO"
    },
    "tags": ["东京都", "千代田区", "东日本旅客铁道", "东海旅客铁道", "东京地下铁", "在来线", "新干线", "地下铁"],
    "exits": [
      {
        "id": 0,
        "name": {
          "kanji": "丸の内北口・八重洲北口",
          "english": "Marunouchi North Gate・Yaesu North Gate"
        }
      },
      {
        "id": 1,
        "name": {
          "kanji": "丸の内中央口・八重洲中央口",
          "english": "Marunouchi Central Gate・Yaesu Central Gate"
        }
      },
      {
        "id": 2,
        "name": {
          "kanji": "丸の内南口・八重洲南口",
          "english": "Marunouchi South Gate・Yaesu South Gate"
        }
      }
    ],
    "platforms": [
      {
        "id": 0,
        "name": {
          "kanji": "4番線 山手線 内回り",
          "english": "Platform 4"
        },
        "doorside": "Left",
        "numberings": [
          {
            "letter": "JY",
            "number": "01",
            "type": "JRE"
          }
        ],
        "blocks": [
          {
            "exit": 0,
            "units": [
              {
                "objects": []
              },
              {
                "objects": [
                  {
                    "type": "DownStairs",
                    "direction": "Opposite",
                    "pos": "Front"
                  }
                ]
              },
              {
                "objects": []
              },
              {
                "objects": []
              }
            ]
          },
          {
            "exit": 1,
            "units": [
              {
                "objects": []
              },
              {
                "objects": [
                  {
                    "type": "DownEscalator",
                    "direction": "Forward",
                    "pos": "Center"
                  },
                  {
                    "type": "DownStairs",
                    "direction": "Forward",
                    "pos": "Center"
                  }
                ]
              },
              {
                "objects": []
              },
              {
                "objects": [
                  {
                    "type": "DownStairs",
                    "direction": "Opposite",
                    "pos": "Front"
                  }
                ]
              },
              {
                "objects": []
              }
            ]
          }
        ]
      }
    ]
  }
]
```

devices.json 车辆配置

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
