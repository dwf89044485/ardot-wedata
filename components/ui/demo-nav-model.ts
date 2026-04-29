export type DemoFlowId =
  | "welcome-idle"
  | "welcome-agent-selected"
  | "conversation-step-0"
  | "conversation-step-2"
  | "studio-saas";

export interface DemoFlowBaseline {
  viewState: "dataclaw" | "studio";
  chatPhase: "welcome" | "conversation";
  revealStep: 0 | 1 | 2;
  useDefaultAgent: boolean;
}

export interface DemoFlow {
  id: DemoFlowId;
  label: string;
  description: string;
  previewImage: string;
  baseline: DemoFlowBaseline;
}

export const DEMO_FLOWS: DemoFlow[] = [
  {
    id: "welcome-idle",
    label: "欢迎-默认",
    description: "展示专家团欢迎页",
    previewImage: "/demo-previews/welcome-idle.png",
    baseline: {
      viewState: "dataclaw",
      chatPhase: "welcome",
      revealStep: 0,
      useDefaultAgent: false,
    },
  },
  {
    id: "welcome-agent-selected",
    label: "欢迎-已选专家",
    description: "展示已召唤专家的欢迎态",
    previewImage: "/demo-previews/welcome-agent-selected.png",
    baseline: {
      viewState: "dataclaw",
      chatPhase: "welcome",
      revealStep: 0,
      useDefaultAgent: true,
    },
  },
  {
    id: "conversation-step-0",
    label: "对话-第1步",
    description: "展示用户消息后的第一步",
    previewImage: "/demo-previews/conversation-step-0.png",
    baseline: {
      viewState: "dataclaw",
      chatPhase: "conversation",
      revealStep: 0,
      useDefaultAgent: true,
    },
  },
  {
    id: "conversation-step-2",
    label: "对话-计划页",
    description: "展示思考摘要与任务计划",
    previewImage: "/demo-previews/conversation-step-2.png",
    baseline: {
      viewState: "dataclaw",
      chatPhase: "conversation",
      revealStep: 2,
      useDefaultAgent: true,
    },
  },
  {
    id: "studio-saas",
    label: "Studio",
    description: "展示 Studio 控制台视图",
    previewImage: "/demo-previews/studio-saas.png",
    baseline: {
      viewState: "studio",
      chatPhase: "conversation",
      revealStep: 2,
      useDefaultAgent: true,
    },
  },
];

export const DEMO_DEFAULT_FLOW_ID: DemoFlowId = "welcome-idle";

export const getDemoFlowById = (flowId: DemoFlowId) =>
  DEMO_FLOWS.find((flow) => flow.id === flowId) ?? DEMO_FLOWS[0];
