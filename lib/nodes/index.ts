import type { NodeDefinition } from "@/lib/nodes/types";

export const NODE_DEFINITION_LIST: NodeDefinition[] = [
  {
    type: "trigger_schedule",
    label: "\uC2A4\uCF00\uC904 \uD2B8\uB9AC\uAC70",
    description: "\uC124\uC815\uD55C \uC2DC\uAC04\uC5D0 \uC790\uB3D9\uC73C\uB85C \uC2E4\uD589\uB429\uB2C8\uB2E4.",
    icon: "\u23F0",
    category: "trigger",
    configSchema: [
      {
        key: "cron_expression",
        label: "Cron Expression",
        type: "text",
        required: true,
        placeholder: "0 9 * * 1-5",
        description: "\uD3C9\uC77C \uC624\uC804 9\uC2DC \uC608\uC2DC"
      },
      {
        key: "timezone",
        label: "Timezone",
        type: "select",
        required: true,
        defaultValue: "Asia/Seoul",
        options: [
          {
            label: "Asia/Seoul",
            value: "Asia/Seoul"
          },
          {
            label: "UTC",
            value: "UTC"
          }
        ]
      }
    ],
    outputExample: {
      triggered_at: "2026-03-13T09:00:00.000Z",
      trigger_type: "schedule"
    }
  },
  {
    type: "trigger_manual",
    label: "\uC218\uB3D9 \uC2E4\uD589",
    description: "\uBC84\uD2BC \uD074\uB9AD\uC73C\uB85C \uC9C1\uC811 \uC2E4\uD589\uD569\uB2C8\uB2E4.",
    icon: "\u25B6\uFE0F",
    category: "trigger",
    configSchema: [],
    outputExample: {
      triggered_at: "2026-03-13T09:00:00.000Z",
      trigger_type: "manual"
    }
  },
  {
    type: "trigger_webhook",
    label: "\uC6F9\uD6C5 \uD2B8\uB9AC\uAC70",
    description: "\uC678\uBD80 \uC694\uCCAD(GET/POST)\uC774 \uB4E4\uC5B4\uC624\uBA74 \uBC14\uB85C \uC2E4\uD589\uB429\uB2C8\uB2E4.",
    icon: "\uD83E\uDE9D",
    category: "trigger",
    configSchema: [
      {
        key: "webhook_secret",
        label: "Webhook Secret",
        type: "text",
        required: true,
        placeholder: "naier-webhook-secret"
      },
      {
        key: "accept_method",
        label: "\uD5C8\uC6A9 Method",
        type: "select",
        required: true,
        defaultValue: "POST",
        options: [
          {
            label: "POST",
            value: "POST"
          },
          {
            label: "GET",
            value: "GET"
          },
          {
            label: "ANY",
            value: "ANY"
          }
        ]
      }
    ],
    outputExample: {
      triggered_at: "2026-03-13T09:00:00.000Z",
      trigger_type: "webhook",
      webhook: {
        method: "POST",
        query: {
          market: "kospi"
        }
      }
    }
  },
  {
    type: "http_request",
    label: "HTTP \uC694\uCCAD",
    description: "\uC678\uBD80 API\uB098 \uC11C\uBE44\uC2A4\uC5D0 HTTP \uC694\uCCAD\uC744 \uBCF4\uB0C5\uB2C8\uB2E4.",
    icon: "\uD83C\uDF10",
    category: "source",
    configSchema: [
      {
        key: "url",
        label: "URL",
        type: "text",
        required: true,
        placeholder: "https://api.example.com/v1/items"
      },
      {
        key: "method",
        label: "Method",
        type: "select",
        required: true,
        defaultValue: "GET",
        options: [
          { label: "GET", value: "GET" },
          { label: "POST", value: "POST" },
          { label: "PUT", value: "PUT" },
          { label: "PATCH", value: "PATCH" },
          { label: "DELETE", value: "DELETE" }
        ]
      },
      {
        key: "headers_json",
        label: "Headers JSON",
        type: "textarea",
        required: false,
        placeholder: "{\n  \"Authorization\": \"Bearer ...\"\n}"
      },
      {
        key: "body_template",
        label: "Body Template",
        type: "textarea",
        required: false,
        placeholder: "{\n  \"message\": \"{{input.text}}\"\n}"
      },
      {
        key: "response_type",
        label: "Response Type",
        type: "select",
        required: true,
        defaultValue: "json",
        options: [
          { label: "json", value: "json" },
          { label: "text", value: "text" }
        ]
      },
      {
        key: "timeout_seconds",
        label: "Timeout (sec)",
        type: "number",
        required: false,
        defaultValue: 20,
        min: 1,
        max: 60
      }
    ],
    outputExample: {
      ok: true,
      status: 200,
      data: {
        items: [{ id: "1", title: "example" }]
      }
    }
  },
  {
    type: "dart_news",
    label: "DART \uACF5\uC2DC \uC218\uC9D1",
    description: "\uAE08\uC735\uAC10\uB3C5\uC6D0 DART\uC5D0\uC11C \uAE30\uC5C5 \uACF5\uC2DC\uB97C \uAC00\uC838\uC635\uB2C8\uB2E4.",
    icon: "\uD83D\uDCCB",
    category: "source",
    configSchema: [
      {
        key: "corp_code",
        label: "\uC885\uBAA9 \uCF54\uB4DC",
        type: "text",
        required: true,
        placeholder: "005930 (\uC0BC\uC131\uC804\uC790)"
      },
      {
        key: "corp_name",
        label: "\uC885\uBAA9\uBA85",
        type: "text",
        required: false,
        placeholder: "\uC885\uBAA9\uBA85 (\uD45C\uC2DC\uC6A9)"
      },
      {
        key: "report_types",
        label: "\uACF5\uC2DC \uC720\uD615",
        type: "select",
        required: false,
        multiple: true,
        defaultValue: ["A", "B", "C", "D"],
        options: [
          {
            label: "\uC815\uAE30\uACF5\uC2DC",
            value: "A"
          },
          {
            label: "\uC8FC\uC694\uC0AC\uD56D \uBCF4\uACE0",
            value: "B"
          },
          {
            label: "\uBC1C\uD589\uACF5\uC2DC",
            value: "C"
          },
          {
            label: "\uC678\uBD80\uAC10\uC0AC",
            value: "D"
          }
        ]
      },
      {
        key: "days_back",
        label: "\uC870\uD68C \uAE30\uAC04(\uC77C)",
        type: "number",
        required: false,
        defaultValue: 1,
        placeholder: "\uCD5C\uADFC N\uC77C \uACF5\uC2DC"
      }
    ],
    outputExample: {
      disclosures: [
        {
          title: "\uC0BC\uC131\uC804\uC790 \uBD84\uAE30\uBCF4\uACE0\uC11C",
          corp_name: "\uC0BC\uC131\uC804\uC790",
          date: "2026-03-13",
          url: "https://dart.fss.or.kr",
          type: "A"
        }
      ]
    }
  },
  {
    type: "naver_stock_news",
    label: "\uB124\uC774\uBC84 \uC8FC\uC2DD \uB274\uC2A4",
    description: "\uB124\uC774\uBC84 \uAE08\uC735\uC5D0\uC11C \uC885\uBAA9 \uAD00\uB828 \uB274\uC2A4\uB97C \uAC00\uC838\uC635\uB2C8\uB2E4.",
    icon: "\uD83D\uDCF0",
    category: "source",
    configSchema: [
      {
        key: "stock_codes",
        label: "\uC885\uBAA9 \uCF54\uB4DC \uBAA9\uB85D",
        type: "textarea",
        required: true,
        placeholder: "005930,000660\n(\uD55C \uC904\uC5D0 \uD558\uB098\uC529 \uB610\uB294 \uC27C\uD45C \uAD6C\uBD84)"
      },
      {
        key: "keywords",
        label: "\uD544\uD130 \uD0A4\uC6CC\uB4DC",
        type: "textarea",
        required: false,
        placeholder: "\uBC18\uB3C4\uCCB4,\uC2E4\uC801\n(\uD544\uD130\uB9C1 \uD0A4\uC6CC\uB4DC)"
      },
      {
        key: "max_items",
        label: "\uCD5C\uB300 \uC218\uC9D1 \uAC74\uC218",
        type: "number",
        required: false,
        defaultValue: 10
      }
    ],
    outputExample: {
      news: [
        {
          title: "\uC0BC\uC131\uC804\uC790, \uBC18\uB3C4\uCCB4 \uD68C\uBCF5 \uAE30\uB300",
          summary: "\uC99D\uAD8C\uAC00 \uB9AC\uD3EC\uD2B8 \uC694\uC57D",
          url: "https://finance.naver.com",
          source: "\uC5F0\uD569\uB274\uC2A4",
          publishedAt: "2026-03-13T08:10:00+09:00",
          stockCode: "005930"
        }
      ]
    }
  },
  {
    type: "korea_stock_price",
    label: "\uAD6D\uB0B4 \uC8FC\uAC00 \uC870\uD68C",
    description: "\uC2E4\uC2DC\uAC04 \uC8FC\uAC00 \uBC0F \uB4F1\uB77D\uB960\uC744 \uC870\uD68C\uD569\uB2C8\uB2E4.",
    icon: "\uD83D\uDCC8",
    category: "source",
    configSchema: [
      {
        key: "stock_codes",
        label: "\uC885\uBAA9 \uCF54\uB4DC",
        type: "textarea",
        required: true,
        placeholder: "005930,000660"
      },
      {
        key: "include_indicators",
        label: "\uAE30\uC220 \uC9C0\uD45C \uD3EC\uD568 (MA, RSI)",
        type: "boolean",
        required: false,
        defaultValue: false
      }
    ],
    outputExample: {
      prices: [
        {
          code: "005930",
          name: "\uC0BC\uC131\uC804\uC790",
          price: 81200,
          change: 2400,
          changeRate: 3.05,
          volume: 18200000,
          marketCap: 484000000000000
        }
      ]
    }
  },
  {
    type: "text_template",
    label: "\uD15C\uD50C\uB9BF \uBCC0\uD658",
    description: "\uC785\uB825 \uB370\uC774\uD130\uB97C \uBB38\uC790\uC5F4 \uD15C\uD50C\uB9BF\uC73C\uB85C \uAC00\uACF5\uD569\uB2C8\uB2E4.",
    icon: "\uD83E\uDDFE",
    category: "filter",
    configSchema: [
      {
        key: "template",
        label: "Template",
        type: "textarea",
        required: true,
        defaultValue: "{{input}}"
      },
      {
        key: "output_key",
        label: "Output Key",
        type: "text",
        required: false,
        defaultValue: "text",
        placeholder: "text"
      }
    ],
    outputExample: {
      text: "Rendered output",
      original: {
        title: "Example"
      }
    }
  },
  {
    type: "filter_keyword",
    label: "\uD0A4\uC6CC\uB4DC \uD544\uD130",
    description: "\uD2B9\uC815 \uD0A4\uC6CC\uB4DC\uAC00 \uD3EC\uD568\uB41C \uD56D\uBAA9\uB9CC \uD1B5\uACFC\uC2DC\uD0B5\uB2C8\uB2E4.",
    icon: "\uD83D\uDD0D",
    category: "filter",
    configSchema: [
      {
        key: "keywords",
        label: "\uD0A4\uC6CC\uB4DC",
        type: "textarea",
        required: true,
        placeholder: "\uC2E4\uC801,\uB9E4\uCD9C,\uC601\uC5C5\uC774\uC775"
      },
      {
        key: "match_type",
        label: "\uB9E4\uCE6D \uC870\uAC74",
        type: "select",
        required: true,
        defaultValue: "any",
        options: [
          {
            label: "\uD558\uB098\uB77C\uB3C4 \uD3EC\uD568",
            value: "any"
          },
          {
            label: "\uBAA8\uB450 \uD3EC\uD568",
            value: "all"
          }
        ]
      },
      {
        key: "case_sensitive",
        label: "\uB300\uC18C\uBB38\uC790 \uAD6C\uBD84",
        type: "boolean",
        required: false,
        defaultValue: false
      },
      {
        key: "target_field",
        label: "\uAC80\uC0C9 \uB300\uC0C1 \uD544\uB4DC",
        type: "select",
        required: true,
        defaultValue: "all",
        options: [
          {
            label: "title",
            value: "title"
          },
          {
            label: "content",
            value: "content"
          },
          {
            label: "all",
            value: "all"
          }
        ]
      }
    ],
    outputExample: {
      items: [
        {
          title: "\uBC18\uB3C4\uCCB4 \uC2E4\uC801 \uAC1C\uC120",
          content: "\uD0A4\uC6CC\uB4DC \uD544\uD130\uB97C \uD1B5\uACFC\uD55C \uD56D\uBAA9"
        }
      ]
    }
  },
  {
    type: "condition",
    label: "\uC870\uAC74 \uBD84\uAE30",
    description: "\uC870\uAC74\uC5D0 \uB530\uB77C \uB2E4\uB978 \uACBD\uB85C\uB85C \uBD84\uAE30\uD569\uB2C8\uB2E4.",
    icon: "\uD83D\uDD00",
    category: "filter",
    configSchema: [
      {
        key: "field_path",
        label: "\uD544\uB4DC \uACBD\uB85C",
        type: "text",
        required: true,
        placeholder: "prices.0.changeRate"
      },
      {
        key: "operator",
        label: "\uBE44\uAD50 \uC5F0\uC0B0\uC790",
        type: "select",
        required: true,
        defaultValue: ">",
        options: [
          {
            label: ">",
            value: ">"
          },
          {
            label: "<",
            value: "<"
          },
          {
            label: ">=",
            value: ">="
          },
          {
            label: "<=",
            value: "<="
          },
          {
            label: "==",
            value: "=="
          },
          {
            label: "!=",
            value: "!="
          },
          {
            label: "contains",
            value: "contains"
          }
        ]
      },
      {
        key: "value",
        label: "\uBE44\uAD50 \uAC12",
        type: "text",
        required: true,
        placeholder: "5 \uB610\uB294 -3.5"
      }
    ],
    outputExample: {
      matched: true,
      data: {
        prices: [
          {
            code: "005930",
            changeRate: 5.2
          }
        ]
      }
    }
  },
  {
    type: "delay",
    label: "\uC9C0\uC5F0",
    description: "\uB2E4\uC74C \uB178\uB4DC \uC2E4\uD589 \uC804 \uC9C0\uC815 \uC2DC\uAC04\uB9CC\uD07C \uB300\uAE30\uD569\uB2C8\uB2E4.",
    icon: "\u23F1\uFE0F",
    category: "filter",
    configSchema: [
      {
        key: "seconds",
        label: "\uB300\uAE30 \uCD08",
        type: "number",
        required: true,
        min: 1,
        max: 300,
        placeholder: "30"
      }
    ],
    outputExample: {
      delayed: true,
      seconds: 30
    }
  },
  {
    type: "agent_task",
    label: "AI Agent Task",
    description:
      "Gemini\uB85C \uC784\uC758 \uC785\uB825\uC744 \uBD84\uC11D\uD558\uACE0 \uC2E4\uD589 \uAC00\uB2A5\uD55C \uACB0\uACFC\uB97C \uB9CC\uB4ED\uB2C8\uB2E4.",
    icon: "\uD83E\uDDE0",
    category: "ai",
    configSchema: [
      {
        key: "prompt_template",
        label: "Prompt Template",
        type: "textarea",
        required: true,
        defaultValue:
          "\uB2E4\uC74C \uC785\uB825\uC744 \uBD84\uC11D\uD558\uACE0 \uB2E4\uC74C \uC2E4\uD589 \uB2E8\uACC4\uC5D0 \uB3C4\uC6C0\uC774 \uB418\uB294 \uACB0\uACFC\uB97C \uB9CC\uB4E4\uC5B4\uC918:\n\n{{input}}"
      },
      {
        key: "output_format",
        label: "Output Format",
        type: "select",
        required: true,
        defaultValue: "text",
        options: [
          { label: "text", value: "text" },
          { label: "json", value: "json" }
        ]
      },
      {
        key: "model",
        label: "Gemini Model",
        type: "select",
        required: true,
        defaultValue: "gemini-2.0-flash",
        options: [
          { label: "gemini-2.0-flash", value: "gemini-2.0-flash" },
          { label: "gemini-1.5-flash", value: "gemini-1.5-flash" }
        ]
      }
    ],
    outputExample: {
      text: "Summarized action plan",
      result: {
        priority: "high"
      }
    }
  },
  {
    type: "ai_summarize",
    label: "AI \uC694\uC57D/\uBD84\uC11D",
    description:
      "Gemini AI\uB85C \uB274\uC2A4/\uACF5\uC2DC\uB97C \uD55C\uAD6D\uC5B4\uB85C \uC694\uC57D\uD569\uB2C8\uB2E4 (\uBCF8\uC778 API \uD0A4 \uC0AC\uC6A9).",
    icon: "\uD83E\uDD16",
    category: "ai",
    configSchema: [
      {
        key: "prompt_template",
        label: "\uC694\uC57D \uD504\uB86C\uD504\uD2B8",
        type: "textarea",
        required: true,
        defaultValue:
          "\uB2E4\uC74C \uC8FC\uC2DD \uAD00\uB828 \uB0B4\uC6A9\uC744 \uD55C\uAD6D \uAC1C\uC778\uD22C\uC790\uC790 \uAD00\uC810\uC5D0\uC11C 3\uC904\uB85C \uC694\uC57D\uD574\uC8FC\uC138\uC694:\n\n{{input}}"
      },
      {
        key: "max_items",
        label: "\uCD5C\uB300 \uCC98\uB9AC \uAC74\uC218",
        type: "number",
        required: false,
        defaultValue: 5
      },
      {
        key: "model",
        label: "Gemini Model",
        type: "select",
        required: true,
        defaultValue: "gemini-2.0-flash",
        options: [
          {
            label: "gemini-2.0-flash",
            value: "gemini-2.0-flash"
          },
          {
            label: "gemini-1.5-flash",
            value: "gemini-1.5-flash"
          }
        ]
      }
    ],
    outputExample: {
      summaries: [
        {
          original: {
            title: "\uC0BC\uC131\uC804\uC790 \uC2E4\uC801 \uAC1C\uC120"
          },
          summary: "\uBC18\uB3C4\uCCB4 \uD68C\uBCF5 \uAE30\uB300\uAC10\uC73C\uB85C \uD22C\uC790 \uC2EC\uB9AC\uAC00 \uAC1C\uC120\uB410\uC2B5\uB2C8\uB2E4.",
          sentiment: "positive"
        }
      ]
    }
  },
  {
    type: "send_telegram",
    label: "\uD154\uB808\uADF8\uB7A8 \uC804\uC1A1",
    description:
      "\uD154\uB808\uADF8\uB7A8 \uBD07\uC73C\uB85C \uBA54\uC2DC\uC9C0\uB97C \uC804\uC1A1\uD569\uB2C8\uB2E4 (\uBCF8\uC778 \uBD07 \uD1A0\uD070 \uC0AC\uC6A9).",
    icon: "\u2708\uFE0F",
    category: "action",
    configSchema: [
      {
        key: "message_template",
        label: "\uBA54\uC2DC\uC9C0 \uD15C\uD50C\uB9BF",
        type: "textarea",
        required: true,
        defaultValue:
          "\uD83D\uDCE1 *Naier \uC54C\uB9BC*\n\n{{#each items}}\u2022 {{this.title}}\n{{/each}}"
      },
      {
        key: "parse_mode",
        label: "Parse Mode",
        type: "select",
        required: true,
        defaultValue: "Markdown",
        options: [
          {
            label: "Markdown",
            value: "Markdown"
          },
          {
            label: "HTML",
            value: "HTML"
          },
          {
            label: "plain",
            value: "plain"
          }
        ]
      },
      {
        key: "disable_preview",
        label: "\uB9C1\uD06C \uBBF8\uB9AC\uBCF4\uAE30 \uBE44\uD65C\uC131\uD654",
        type: "boolean",
        required: false,
        defaultValue: true
      }
    ],
    outputExample: {
      sent: true,
      messageId: 123456
    }
  },
  {
    type: "send_discord",
    label: "\uB514\uC2A4\uCF54\uB4DC \uC804\uC1A1",
    description: "\uB514\uC2A4\uCF54\uB4DC \uC6F9\uD6C5\uC73C\uB85C \uBA54\uC2DC\uC9C0\uB97C \uC804\uC1A1\uD569\uB2C8\uB2E4.",
    icon: "\uD83D\uDCAC",
    category: "action",
    configSchema: [
      {
        key: "message_template",
        label: "\uBA54\uC2DC\uC9C0 \uD15C\uD50C\uB9BF",
        type: "textarea",
        required: true,
        placeholder: "\uC54C\uB9BC \uBA54\uC2DC\uC9C0 \uD15C\uD50C\uB9BF"
      },
      {
        key: "username",
        label: "Username",
        type: "text",
        required: false,
        placeholder: "Naier Bot"
      },
      {
        key: "embed_color",
        label: "Embed Color",
        type: "text",
        required: false,
        placeholder: "#00d4aa"
      }
    ],
    outputExample: {
      sent: true
    }
  },
  {
    type: "send_email",
    label: "\uC774\uBA54\uC77C \uC804\uC1A1",
    description: "\uC124\uC815\uD55C \uC774\uBA54\uC77C\uB85C \uB9AC\uD3EC\uD2B8\uB97C \uC804\uC1A1\uD569\uB2C8\uB2E4.",
    icon: "\uD83D\uDCE7",
    category: "action",
    configSchema: [
      {
        key: "subject_template",
        label: "\uC81C\uBAA9 \uD15C\uD50C\uB9BF",
        type: "text",
        required: true,
        placeholder: "\uD83D\uDCC8 {{date}} \uC8FC\uC2DD \uC54C\uB9BC"
      },
      {
        key: "body_template",
        label: "\uBCF8\uBB38 \uD15C\uD50C\uB9BF",
        type: "textarea",
        required: true,
        placeholder: "\uC774\uBA54\uC77C \uBCF8\uBB38 \uD15C\uD50C\uB9BF"
      },
      {
        key: "format",
        label: "\uD3EC\uB9F7",
        type: "select",
        required: true,
        defaultValue: "html",
        options: [
          {
            label: "html",
            value: "html"
          },
          {
            label: "text",
            value: "text"
          }
        ]
      }
    ],
    outputExample: {
      sent: true,
      messageId: "<naier@example.com>"
    }
  }
];

export type {
  NodeCategory,
  NodeConfigField,
  NodeConfigFieldOption,
  NodeConfigFieldType,
  NodeDefinition,
  NodeType
} from "@/lib/nodes/types";
