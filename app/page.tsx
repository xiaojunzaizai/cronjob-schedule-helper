"use client";

import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  InputNumber,
  Layout,
  message,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  AppleOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import "antd/dist/reset.css";
import "./page.css";

const { Title, Text, Paragraph } = Typography;

type CronMode = "any" | "fixed" | "range" | "step" | "range_step";

type CronFieldConfig = {
  mode: CronMode;
  fixed: number;
  start: number;
  end: number;
  step: number;
};

type CronFieldKey = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

type CronFieldMeta = {
  key: CronFieldKey;
  label: string;
  cronName: string;
  min: number;
  max: number;
  defaultFixed: number;
  defaultStart: number;
  defaultEnd: number;
  defaultStep: number;
};

const fieldMetas: CronFieldMeta[] = [
  {
    key: "minute",
    label: "Minute",
    cronName: "minute",
    min: 0,
    max: 59,
    defaultFixed: 0,
    defaultStart: 0,
    defaultEnd: 30,
    defaultStep: 5,
  },
  {
    key: "hour",
    label: "Hour",
    cronName: "hour",
    min: 0,
    max: 23,
    defaultFixed: 9,
    defaultStart: 9,
    defaultEnd: 17,
    defaultStep: 1,
  },
  {
    key: "dayOfMonth",
    label: "Day of Month",
    cronName: "day-of-month",
    min: 1,
    max: 31,
    defaultFixed: 1,
    defaultStart: 1,
    defaultEnd: 15,
    defaultStep: 1,
  },
  {
    key: "month",
    label: "Month",
    cronName: "month",
    min: 1,
    max: 12,
    defaultFixed: 1,
    defaultStart: 1,
    defaultEnd: 12,
    defaultStep: 1,
  },
  {
    key: "dayOfWeek",
    label: "Day of Week",
    cronName: "day-of-week",
    min: 0,
    max: 6,
    defaultFixed: 1,
    defaultStart: 1,
    defaultEnd: 5,
    defaultStep: 1,
  },
];

const defaultFields: Record<CronFieldKey, CronFieldConfig> = {
  minute: {
    mode: "fixed",
    fixed: 0,
    start: 0,
    end: 30,
    step: 5,
  },
  hour: {
    mode: "range",
    fixed: 9,
    start: 10,
    end: 15,
    step: 1,
  },
  dayOfMonth: {
    mode: "any",
    fixed: 1,
    start: 1,
    end: 15,
    step: 1,
  },
  month: {
    mode: "any",
    fixed: 1,
    start: 1,
    end: 12,
    step: 1,
  },
  dayOfWeek: {
    mode: "range",
    fixed: 1,
    start: 2,
    end: 5,
    step: 1,
  },
};

const modeOptions = [
  { label: "Any (*)", value: "any" },
  { label: "Fixed Value", value: "fixed" },
  { label: "Range", value: "range" },
  { label: "Step", value: "step" },
  { label: "Range + Step", value: "range_step" },
];

function buildCronPart(config: CronFieldConfig) {
  switch (config.mode) {
    case "any":
      return "*";
    case "fixed":
      return String(config.fixed);
    case "range":
      return `${config.start}-${config.end}`;
    case "step":
      return `*/${config.step}`;
    case "range_step":
      return `${config.start}-${config.end}/${config.step}`;
    default:
      return "*";
  }
}

function matchesCronPart(value: number, config: CronFieldConfig) {
  switch (config.mode) {
    case "any":
      return true;

    case "fixed":
      return value === config.fixed;

    case "range":
      return value >= config.start && value <= config.end;

    case "step":
      return value % config.step === 0;

    case "range_step":
      return (
        value >= config.start &&
        value <= config.end &&
        (value - config.start) % config.step === 0
      );

    default:
      return false;
  }
}

function CronFieldEditor({
  meta,
  value,
  onChange,
}: {
  meta: CronFieldMeta;
  value: CronFieldConfig;
  onChange: (next: CronFieldConfig) => void;
}) {
  const update = (partial: Partial<CronFieldConfig>) => {
    onChange({
      ...value,
      ...partial,
    });
  };

  return (
    <Card className="cron-field-card">
      <Space orientation="vertical" size={12} className="full-width">
        <div>
          <Text strong>{meta.label}</Text>
          <div>
            <Text type="secondary">
              {meta.cronName}: {meta.min} - {meta.max}
            </Text>
          </div>
        </div>

        <Select
          value={value.mode}
          onChange={(mode) => update({ mode })}
          options={modeOptions}
          className="full-width"
          size="large"
        />

        {value.mode === "fixed" && (
          <Space.Compact className="full-width">
            <div className="input-prefix">Value</div>
            <InputNumber
              min={meta.min}
              max={meta.max}
              value={value.fixed}
              onChange={(v) => update({ fixed: v ?? meta.defaultFixed })}
              className="full-width"
              size="large"
            />
          </Space.Compact>
        )}

        {(value.mode === "range" || value.mode === "range_step") && (
          <Row gutter={12}>
            <Col span={12}>
              <Space.Compact className="full-width">
                <div className="input-prefix">Start</div>
                <InputNumber
                  min={meta.min}
                  max={meta.max}
                  value={value.start}
                  onChange={(v) => update({ start: v ?? meta.defaultStart })}
                  className="full-width"
                  size="large"
                />
              </Space.Compact>
            </Col>

            <Col span={12}>
              <Space.Compact className="full-width">
                <div className="input-prefix">End</div>
                <InputNumber
                  min={meta.min}
                  max={meta.max}
                  value={value.end}
                  onChange={(v) => update({ end: v ?? meta.defaultEnd })}
                  className="full-width"
                  size="large"
                />
              </Space.Compact>
            </Col>
          </Row>
        )}

        {(value.mode === "step" || value.mode === "range_step") && (
          <Space.Compact className="full-width">
            <div className="input-prefix">Step</div>
            <InputNumber
              min={1}
              max={meta.max}
              value={value.step}
              onChange={(v) => update({ step: v ?? meta.defaultStep })}
              className="full-width"
              size="large"
            />
          </Space.Compact>
        )}

        <Tag className="cron-part-tag">{buildCronPart(value)}</Tag>
      </Space>
    </Card>
  );
}

export default function CronSchedulePage() {
  const [fields, setFields] =
    useState<Record<CronFieldKey, CronFieldConfig>>(defaultFields);

  const [simulationResult, setSimulationResult] = useState<string[]>([]);

  const cronExpression = useMemo(() => {
    return [
      buildCronPart(fields.minute),
      buildCronPart(fields.hour),
      buildCronPart(fields.dayOfMonth),
      buildCronPart(fields.month),
      buildCronPart(fields.dayOfWeek),
    ].join(" ");
  }, [fields]);

  function updateField(key: CronFieldKey, value: CronFieldConfig) {
    setFields((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function validateSchedule() {
    for (const meta of fieldMetas) {
      const config = fields[meta.key];

      if (
        ["range", "range_step"].includes(config.mode) &&
        config.start > config.end
      ) {
        message.error(`${meta.label}: start cannot be greater than end`);
        return false;
      }

      if (["step", "range_step"].includes(config.mode) && config.step <= 0) {
        message.error(`${meta.label}: step must be greater than 0`);
        return false;
      }
    }

    message.success("Schedule is valid");
    return true;
  }

  function isTriggered(testTime: Dayjs) {
    return (
      matchesCronPart(testTime.minute(), fields.minute) &&
      matchesCronPart(testTime.hour(), fields.hour) &&
      matchesCronPart(testTime.date(), fields.dayOfMonth) &&
      matchesCronPart(testTime.month() + 1, fields.month) &&
      matchesCronPart(testTime.day(), fields.dayOfWeek)
    );
  }

  function runSimulation() {
    if (!validateSchedule()) return;

    const now = dayjs();
    const results: string[] = [];

    for (let i = 0; i < 60 * 24 * 60; i++) {
      const testTime = now.add(i, "minute");

      if (isTriggered(testTime)) {
        results.push(
          `${testTime.format("YYYY-MM-DD HH:mm")} - scheudle is triggered`,
        );
      }

      if (results.length >= 20) break;
    }

    setSimulationResult(results);

    if (results.length > 0) {
      message.success("scheudle is triggered");
    } else {
      message.warning("No trigger found in next 60 days");
    }
  }

  return (
    <Layout className="page-container">
      <div className="page-wrapper">
        <Space orientation="vertical" size={28} className="full-width">
          <div className="hero-section">
            <Tag icon={<AppleOutlined />} className="apple-tag">
              Cron Schedule Helper
            </Tag>

            <Title className="main-title">
              CronJob Schedule 辅助生成和验证
            </Title>

            <Paragraph className="sub-title">
              自由配置 Cron 表达式的每一位，支持固定值、范围、间隔和范围间隔。
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={15}>
              <Card className="apple-card">
                <Title level={3}>Cron Field Designer</Title>
                <Text type="secondary">
                  Cron 格式：minute hour day-of-month month day-of-week
                </Text>

                <Divider />

                <Space orientation="vertical" size={16} className="full-width">
                  {fieldMetas.map((meta) => (
                    <CronFieldEditor
                      key={meta.key}
                      meta={meta}
                      value={fields[meta.key]}
                      onChange={(next) => updateField(meta.key, next)}
                    />
                  ))}
                </Space>

                <Divider />

                <div>
                  <Text strong>Generated Cron Expression</Text>
                  <div className="cron-preview">{cronExpression}</div>
                </div>

                <div className="cron-example-text">
                  Example: <code>0 10-15 * * 2-5</code> means every hour from
                  10:00 to 15:00, Tuesday through Friday.
                </div>

                <Divider />

                <Space>
                  <Button
                    size="large"
                    icon={<CheckCircleOutlined />}
                    onClick={validateSchedule}
                  >
                    Validate
                  </Button>

                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={runSimulation}
                    className="primary-btn"
                  >
                    Run Simulation
                  </Button>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={9}>
              <Card className="apple-card simulation-card">
                <Title level={3}>Simulation Window</Title>
                <Text type="secondary">
                  模拟未来 60 天内的前 20 次触发时间。
                </Text>

                <Divider />

                {simulationResult.length === 0 ? (
                  <div className="simulation-empty">
                    Click “Run Simulation” to test your schedule.
                  </div>
                ) : (
                  <Space orientation="vertical" className="full-width">
                    {simulationResult.map((item, index) => (
                      <div key={index} className="simulation-item">
                        {item}
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    </Layout>
  );
}
