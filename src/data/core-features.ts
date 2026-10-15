import type { Feature } from './features';

export const coreFeatures: Feature[] = [
  {
    "id": "core-branching-workbench",
    "slug": "branching-workbench",
    "name": "Branching workbench",
    "title": "Keep the good answer. Try another direction.",
    "area": "Studio",
    "date": "2025-12-11",
    "topics": [
      "Images",
      "Branches"
    ],
    "intro": "Editing a message forks the conversation. Branch navigation, a tree, fork markers and side-by-side comparison keep alternatives connected to their shared history.",
    "problem": "Changing an earlier instruction can erase the path that produced a useful answer.",
    "built": [
      "Editing a message forks the conversation. Branch navigation, a tree, fork markers and side-by-side comparison keep alternatives connected to their shared history.",
      "Treat a revision as a new branch with a visible parent, not an overwrite; let the user mark a preferred branch."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Treat a revision as a new branch with a visible parent, not an overwrite; let the user mark a preferred branch."
      }
    ],
    "evolution": [
      {
        "date": "2025-12-11",
        "title": "web-v5.1.0"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "resources/js/components/chat/ChatBranchNavigator.vue",
        "resources/js/components/chat/ChatBranchTreeModal.vue",
        "resources/js/components/chat/ChatSplitView.vue",
        "resources/js/composables/useBranchNavigation.ts",
        "app/Models/Conversation.php"
      ],
      "status": "source-current",
      "note": "Source and release record inspected. This page keeps a small invented illustration; the linked Branch Lab adds an actual isolated PanelForge run with fictional data, seeded answers and an explicitly unreleased comparison fix.",
      "release": "web-v5.1.0"
    },
    "related": [
      "branching-workbench",
      "reference-to-chat",
      "workspace-hierarchy"
    ],
    "exhibit": {
      "title": "One brief, two directions",
      "caption": "Local explanatory exhibit · invented records · no live service or agent call",
      "steps": [
        {
          "name": "Original brief",
          "detail": "A quiet library poster"
        },
        {
          "name": "Warmer revision",
          "detail": "Terracotta, evening light"
        }
      ],
      "choices": [
        {
          "label": "Original brief",
          "result": "A quiet library poster",
          "explanation": "One shared brief remains the ancestor of both revisions."
        },
        {
          "label": "Warmer revision",
          "result": "Terracotta, evening light",
          "explanation": "A new direction is a sibling; it does not replace the original."
        }
      ]
    },
    "presentation": "branch"
  },
  {
    "id": "core-reference-to-chat",
    "slug": "reference-to-chat",
    "name": "Reference to chat",
    "title": "Take the image straight into the conversation.",
    "area": "Studio",
    "date": "2025-11-28",
    "topics": [
      "Images",
      "Reference"
    ],
    "intro": "A gallery image can be handed directly to chat; the lightbox also connects to gallery, inpaint and download actions.",
    "problem": "A visual reference becomes cumbersome when it must be downloaded and reattached before asking for a revision.",
    "built": [
      "A gallery image can be handed directly to chat; the lightbox also connects to gallery, inpaint and download actions.",
      "Put the handoff where the image is inspected, so the reference and the request stay in one workflow."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Put the handoff where the image is inspected, so the reference and the request stay in one workflow."
      }
    ],
    "evolution": [
      {
        "date": "2025-11-28",
        "title": "web-v4.13.0"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "resources/js/pages/Gallery/",
        "resources/js/components/chat/",
        "resources/js/composables/useChatAttachments.ts"
      ],
      "status": "source-current",
      "note": "Source and release record inspected. This page keeps a small invented illustration; the linked Branch Lab adds an actual isolated PanelForge run with fictional data, seeded answers and an explicitly unreleased comparison fix.",
      "release": "web-v4.13.0"
    },
    "related": [
      "branching-workbench",
      "reference-to-chat",
      "workspace-hierarchy"
    ],
    "exhibit": {
      "title": "A reference that travels with the request",
      "caption": "Local explanatory exhibit · invented records · no live service or agent call",
      "steps": [
        {
          "name": "Inspect the gallery card",
          "detail": "Reference: Lantern poster"
        },
        {
          "name": "Attach it to a request",
          "detail": "Make the lettering quieter"
        }
      ],
      "choices": [
        {
          "label": "Inspect the gallery card",
          "result": "Reference: Lantern poster",
          "explanation": "The fictional image remains identifiable before the handoff."
        },
        {
          "label": "Attach it to a request",
          "result": "Make the lettering quieter",
          "explanation": "The same reference becomes an attachment beside the new instruction."
        }
      ]
    },
    "presentation": "reference"
  },
  {
    "id": "core-visible-agent-activity",
    "slug": "visible-agent-activity",
    "name": "See what the agent is doing",
    "title": "Read the work around the answer.",
    "area": "Engine",
    "date": "2026-02-02",
    "topics": [
      "Streaming",
      "Interface"
    ],
    "intro": "The chat displays progressive text, thinking blocks, tool calls and results, plus duration, token and cost details for Claude Engine turns.",
    "problem": "A streaming answer can look stalled or opaque when thinking and tool work are hidden inside a plain text bubble.",
    "built": [
      "The chat displays progressive text, thinking blocks, tool calls and results, plus duration, token and cost details for Claude Engine turns.",
      "Render the stream as ordered content blocks and persist tool input/output so a reader can inspect the work around the answer."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Render the stream as ordered content blocks and persist tool input/output so a reader can inspect the work around the answer."
      }
    ],
    "evolution": [
      {
        "date": "2026-02-02",
        "title": "web-v6.8.0"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "resources/js/composables/useClaudeEngineStream.ts",
        "resources/js/components/chat/ClaudeEngineThinkingCard.vue",
        "resources/js/components/chat/ClaudeEngineToolCard.vue",
        "app/Models/ChatToolCall.php",
        "app/Models/ClaudeEngineRawEvent.php"
      ],
      "status": "source-current",
      "note": "Source and release record inspected; no current product execution is claimed for this illustration.",
      "release": "web-v6.8.0"
    },
    "related": [
      "visible-agent-activity",
      "steer-without-interrupt",
      "native-tool-boundary-profiles"
    ],
    "exhibit": {
      "title": "The activity beside the answer",
      "caption": "Local explanatory exhibit · invented records · no live service or agent call",
      "steps": [
        {
          "name": "Inspect the lookup",
          "detail": "Read-only catalog / 3 entries"
        },
        {
          "name": "Read the result",
          "detail": "Two entries suit an offline prototype"
        }
      ],
      "choices": [
        {
          "label": "Inspect the lookup",
          "result": "Read-only catalog / 3 entries",
          "explanation": "The tool input and result sit between the request and answer."
        },
        {
          "label": "Read the result",
          "result": "Two entries suit an offline prototype",
          "explanation": "The final response follows the visible activity; the illustration contains no model call."
        }
      ]
    },
    "presentation": "timeline"
  },
  {
    "id": "core-disconnect-recovery",
    "slug": "disconnect-recovery",
    "name": "Recover the answer after a disconnect",
    "title": "Close the window. Keep the result.",
    "area": "Engine",
    "date": "2026-09-21",
    "topics": [
      "Streaming",
      "Recovery"
    ],
    "intro": "Engine-side result storage and PanelForge recovery let a client reconnect and retrieve an ordered turn timeline and completed response after a foreground stream breaks.",
    "problem": "A browser or proxy connection can disappear while a long-running tool turn continues on the engine.",
    "built": [
      "Engine-side result storage and PanelForge recovery let a client reconnect and retrieve an ordered turn timeline and completed response after a foreground stream breaks.",
      "Keep the foreground event stream separate from a retrievable completion record; restore from a cursor and reconcile ordered activity."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Keep the foreground event stream separate from a retrievable completion record; restore from a cursor and reconcile ordered activity."
      }
    ],
    "evolution": [
      {
        "date": "2026-09-21",
        "title": "claude-engine v6.13.0; panel-forge web-v8.16.0"
      }
    ],
    "sources": {
      "repo": "claude-engine + panel-forge",
      "files": [
        "claude-engine/claude_engine/routes/stream.py",
        "claude-engine/claude_engine/turn_timeline.py",
        "panel-forge/resources/js/composables/useChatStreamRecovery.ts",
        "panel-forge/app/Http/Controllers/Api/ClaudeEngineStreamController.php"
      ],
      "status": "source-current",
      "note": "Source and release record inspected; no current product execution is claimed for this illustration. Scope: browser/SSE disconnect while the Claude Engine turn continues. This does not promise process-restart survival or equivalent behavior in every engine.",
      "release": "claude-engine v6.13.0; panel-forge web-v8.16.0"
    },
    "related": [
      "visible-agent-activity",
      "steer-without-interrupt",
      "native-tool-boundary-profiles"
    ],
    "exhibit": {
      "title": "Two lifetimes, one completed turn",
      "caption": "Local explanatory exhibit · invented records · no live service or agent call",
      "steps": [
        {
          "name": "Foreground disconnects",
          "detail": "Browser stream: disconnected"
        },
        {
          "name": "Client reconnects",
          "detail": "Stored answer + ordered activity"
        }
      ],
      "choices": [
        {
          "label": "Foreground disconnects",
          "result": "Browser stream: disconnected",
          "explanation": "This example separates the client connection from the ongoing turn."
        },
        {
          "label": "Client reconnects",
          "result": "Stored answer + ordered activity",
          "explanation": "Recovery retrieves a completion record. It does not establish engine process-restart survival."
        }
      ]
    },
    "presentation": "recovery"
  },
  {
    "id": "core-steer-without-interrupt",
    "slug": "steer-without-interrupt",
    "name": "Redirect a turn without throwing it away",
    "title": "Correct the direction while the turn continues.",
    "area": "Engine",
    "date": "2026-10-04",
    "topics": [
      "Streaming",
      "Steering"
    ],
    "intro": "A follow-up steer waits for a tool boundary or becomes a same-stream follow-up; multiple steers are delivered in order while the turn continues.",
    "problem": "The old way to correct a running request was to interrupt the turn and start over, potentially losing useful progress.",
    "built": [
      "A follow-up steer waits for a tool boundary or becomes a same-stream follow-up; multiple steers are delivered in order while the turn continues.",
      "Queue and inject steering at a safe boundary, with an explicit delivery marker, instead of treating every new instruction as cancellation."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Queue and inject steering at a safe boundary, with an explicit delivery marker, instead of treating every new instruction as cancellation."
      }
    ],
    "evolution": [
      {
        "date": "2026-10-04",
        "title": "claude-engine v6.15.0; panel-forge web-v10.20.37"
      }
    ],
    "sources": {
      "repo": "claude-engine + panel-forge",
      "files": [
        "claude-engine/claude_engine/routes/stream.py",
        "panel-forge/resources/js/composables/useClaudeEngineStream.ts",
        "panel-forge/app/Http/Controllers/Api/ClaudeEngineStreamController.php"
      ],
      "status": "source-current",
      "note": "Source and release record inspected; no current product execution is claimed for this illustration.",
      "release": "claude-engine v6.15.0; panel-forge web-v10.20.37"
    },
    "related": [
      "visible-agent-activity",
      "steer-without-interrupt",
      "native-tool-boundary-profiles"
    ],
    "exhibit": {
      "title": "The activity beside the answer",
      "caption": "Local explanatory exhibit · invented records · no live service or agent call",
      "steps": [
        {
          "name": "During the lookup",
          "detail": "Queued: use metric units; keep it short"
        },
        {
          "name": "At the delivery boundary",
          "detail": "Applied: metric units / concise response"
        }
      ],
      "choices": [
        {
          "label": "During the lookup",
          "result": "Queued: use metric units; keep it short",
          "explanation": "Two instructions wait in the order they arrived."
        },
        {
          "label": "At the delivery boundary",
          "result": "Applied: metric units / concise response",
          "explanation": "The source supports continued-turn steering, with explicit delivery events."
        }
      ]
    },
    "presentation": "timeline"
  },
  {
    "id": "core-shared-engine-surface",
    "slug": "shared-engine-surface",
    "name": "Three engines, one chat contract",
    "title": "Change the runtime. Keep a readable chat.",
    "area": "Engine",
    "date": "2026-05-18",
    "topics": [
      "Streaming",
      "Interface"
    ],
    "intro": "Claude, Codex and OpenCode report their work differently. The engines translate those messages so the same chat can show text, tools and a finished answer.",
    "problem": "Supporting several agent runtimes can fragment the chat UI and force client code to understand each engine's streaming protocol.",
    "built": [
      "Claude, Codex and OpenCode report their work differently. The engines translate those messages so the same chat can show text, tools and a finished answer.",
      "Keep each upstream integration native to its runtime and normalize the client-facing event envelope at the integration boundary."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Keep each upstream integration native to its runtime and normalize the client-facing event envelope at the integration boundary."
      }
    ],
    "evolution": [
      {
        "date": "2026-05-18",
        "title": "panel-forge web-v7.83.0, web-v7.91.0; codex-engine v0.6.28; opencode-engine v1.0.0"
      }
    ],
    "sources": {
      "repo": "panel-forge + claude-engine + codex-engine + opencode-engine",
      "files": [
        "panel-forge/resources/js/composables/useClaudeEngineStream.ts",
        "panel-forge/resources/js/composables/useCodexEngineStream.ts",
        "panel-forge/resources/js/composables/useOpenCodeEngineStream.ts",
        "claude-engine/claude_engine/invocation.py",
        "claude-engine/tests/test_wire_contract.py",
        "codex-engine/codex_engine/notifications.py",
        "codex-engine/tests/test_notifications.py",
        "opencode-engine/src/translator.ts",
        "opencode-engine/tests/translator.test.ts"
      ],
      "status": "source-current",
      "note": "New synthetic inputs were translated offline through unchanged Claude bf89abc, Codex e1553a5 and OpenCode 671de66 source. All 75 focused original tests passed separately. Claude used real SDK classes with mocked transport and its unit-harness branch. This is saved translation output, not live inference or a full HTTP/SSE client test.",
      "release": "panel-forge web-v7.83.0, web-v7.91.0; codex-engine v0.6.28; opencode-engine v1.0.0"
    },
    "related": [
      "visible-agent-activity",
      "steer-without-interrupt",
      "native-tool-boundary-profiles"
    ],
    "exhibit": {
      "title": "Three upstreams, one event vocabulary",
      "caption": "Saved translation output from pinned source · synthetic inputs · no live model or tool run",
      "steps": [
        {
          "name": "Inspect the upstream",
          "detail": "Claude CLI · Codex app-server · OpenCode serve"
        },
        {
          "name": "Inspect the shared surface",
          "detail": "Text / tool activity / final answer"
        }
      ],
      "choices": [
        {
          "label": "Inspect the upstream",
          "result": "Claude CLI · Codex app-server · OpenCode serve",
          "explanation": "Each integration speaks to its own runtime and manages its own sessions."
        },
        {
          "label": "Inspect the shared surface",
          "result": "Text / tool activity / final answer",
          "explanation": "A shared client contract lets the chat display comparable event kinds. It does not merge model state."
        }
      ]
    },
    "presentation": "adapters"
  },
  {
    "id": "core-native-tool-boundary-profiles",
    "slug": "native-tool-boundary-profiles",
    "name": "Choose the tools an agent may use",
    "title": "Make tool choices an enforced boundary.",
    "area": "Engine",
    "date": "2026-10-09",
    "topics": [
      "Tools",
      "Policy"
    ],
    "intro": "Codex resolves exact native tool identities against a runtime catalog and enforces the selected ceiling. The recorded checks show that grant surviving an app-server restart and same-thread resume.",
    "problem": "A profile that names only allowed MCP tools leaves native shell, browser or other runtime tools outside the visible choice.",
    "built": [
      "Discover the runtime catalog, validate exact selected names and pass an enforced registry ceiling into the patched app-server. The engine also persists its policy record for protected sessions.",
      "The source defines ceiling inheritance for fork and child sessions as well. The execution exhibit here checks resume only; its separate positive control verifies that the excluded patch call form works when granted."
    ],
    "use": [
      {
        "title": "Select an exact native tool",
        "description": "The protected thread grants exec_command, a broad shell tool. Its harmless fixture read does not make that grant a read-only filesystem permission."
      },
      {
        "title": "Resume with the same ceiling",
        "description": "After one app-server restart, the engine resumes the same saved thread and the excluded apply_patch call is unavailable."
      },
      {
        "title": "Check the separate control",
        "description": "A fresh control thread grants apply_patch and creates its expected owned file. The protected thread is not widened."
      }
    ],
    "evolution": [
      {
        "date": "2026-10-09",
        "title": "codex-engine v0.6.28; panel-forge web-v10.20.74"
      }
    ],
    "sources": {
      "repo": "codex-engine + panel-forge",
      "files": [
        "codex-engine/codex_engine/tool_policy.py",
        "codex-engine/codex_engine/native_tools.py",
        "codex-engine/codex_engine/thread_session.py",
        "panel-forge/resources/js/components/settings/tabs/SystemPromptsTab.vue",
        "panel-forge/app/Support/CodexEngine/CodexEngineToolFence.php"
      ],
      "status": "source-current",
      "note": "Source and release history inspected. The 15 October controlled checks ran the actual patched Codex app-server with scripted local upstream messages and synthetic model/account fixtures. They establish a real native read, same-thread app-server resume and separate denied/granted patch outcomes; no real inference or production deployment is claimed.",
      "release": "codex-engine v0.6.28; panel-forge web-v10.20.74"
    },
    "related": [
      "gateway-tool-profiles",
      "visible-agent-activity",
      "steer-without-interrupt"
    ],
    "exhibit": {
      "title": "The grant survives a restart.",
      "caption": "Actual patched app-server; saved results from scripted local tool calls and synthetic model/account fixtures; no real model inference.",
      "steps": [],
      "choices": []
    },
    "presentation": "native-boundary"
  },
  {
    "id": "core-gateway-tool-profiles",
    "slug": "gateway-tool-profiles",
    "name": "A tool gateway with clear boundaries",
    "title": "Check who, what and which tool separately.",
    "area": "Connections",
    "date": "2026-10-06",
    "topics": [
      "Tools",
      "Authorization"
    ],
    "intro": "The gateway separates authentication, resource scopes, owner-only routes and profile-based tool visibility while forwarding tool calls to connected MCP resources.",
    "problem": "Tool names alone do not explain who may call a resource, which tools a profile exposes, or which OAuth scope permits the call.",
    "built": [
      "The gateway separates authentication, resource scopes, owner-only routes and profile-based tool visibility while forwarding tool calls to connected MCP resources.",
      "Keep identity, OAuth authorization and tool catalog filtering as separate checks at the gateway boundary."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Keep identity, OAuth authorization and tool catalog filtering as separate checks at the gateway boundary."
      }
    ],
    "evolution": [
      {
        "date": "2026-10-06",
        "title": "v5.11.15"
      }
    ],
    "sources": {
      "repo": "panelforge-mcp",
      "files": [
        "src/permissions/permission-cache.ts",
        "config/resources.json",
        "src/proxy/proxy-mcp-handler.ts",
        "src/auth/"
      ],
      "status": "source-current",
      "note": "Source and release record inspected; no current product execution is claimed for this illustration.",
      "release": "v5.11.15"
    },
    "related": [
      "gateway-tool-profiles",
      "focus-aware-question",
      "voice-conversation-loop"
    ],
    "exhibit": {
      "title": "One call through three checks",
      "caption": "Local explanatory exhibit · invented records · no live service or agent call",
      "steps": [
        {
          "name": "Missing resource scope",
          "detail": "Stop at authorization"
        },
        {
          "name": "Scope and profile agree",
          "detail": "Forward the permitted call"
        }
      ],
      "choices": [
        {
          "label": "Missing resource scope",
          "result": "Stop at authorization",
          "explanation": "An authenticated identity alone is insufficient for the synthetic request."
        },
        {
          "label": "Scope and profile agree",
          "result": "Forward the permitted call",
          "explanation": "Resource scope and tool visibility are distinct checks; the illustration uses fictional identities."
        }
      ]
    },
    "presentation": "gates"
  },
  {
    "id": "core-focus-aware-question",
    "slug": "focus-aware-question",
    "name": "Ask the person who can answer",
    "title": "Bring a waiting decision back to the work.",
    "area": "Connections",
    "date": "2026-10-07",
    "topics": [
      "Human decisions"
    ],
    "intro": "Attention questions can create a durable question card routed through PanelForge and Relay to an Apple client; the answer or decline returns to the waiting agent.",
    "problem": "An agent may need a human decision when the person is away from the pane where the work is running.",
    "built": [
      "Attention questions can create a durable question card routed through PanelForge and Relay to an Apple client; the answer or decline returns to the waiting agent.",
      "Represent the question as durable state and use focus/session context for routing, instead of making the agent guess whether a pane is attended."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Represent the question as durable state and use focus/session context for routing, instead of making the agent guess whether a pane is attended."
      }
    ],
    "evolution": [
      {
        "date": "2026-10-07",
        "title": "attention-mcp v0.1.2; claude-relay commit f2250af (2026-09-30)"
      }
    ],
    "sources": {
      "repo": "attention-mcp + claude-relay + panel-forge + claude-engine-app",
      "files": [
        "attention-mcp/attention_mcp/server.py",
        "claude-relay/README.md",
        "claude-relay/attention_presentation.go",
        "claude-relay/decisions.go",
        "claude-engine-app/Targets/iOS/"
      ],
      "status": "source-current",
      "note": "Source and release record inspected; no current product execution is claimed for this illustration. Current Attention instructions always use an Engine question card; focus-dependent routing belongs to the historical record.",
      "release": "attention-mcp v0.1.2; claude-relay commit f2250af (2026-09-30)"
    },
    "related": [
      "gateway-tool-profiles",
      "focus-aware-question",
      "voice-conversation-loop"
    ],
    "exhibit": {
      "title": "A decision with a return path",
      "caption": "Local explanatory exhibit · invented records · no live service or agent call",
      "steps": [
        {
          "name": "Question waiting",
          "detail": "Which poster should we continue?"
        },
        {
          "name": "Person chooses terracotta",
          "detail": "Answer returns to the waiting task"
        }
      ],
      "choices": [
        {
          "label": "Question waiting",
          "result": "Which poster should we continue?",
          "explanation": "A question card represents pending state beyond the terminal pane."
        },
        {
          "label": "Person chooses terracotta",
          "result": "Answer returns to the waiting task",
          "explanation": "The decision has an identity and an answer path. Current delivery uses an Engine question card; historical routing varied with focus."
        }
      ]
    },
    "presentation": "question"
  },
  {
    "id": "core-voice-conversation-loop",
    "slug": "voice-conversation-loop",
    "name": "A voice conversation with visible state",
    "title": "Make a spoken conversation visible.",
    "area": "Connections",
    "date": "2026-02-12",
    "topics": [
      "Voice",
      "Interface"
    ],
    "intro": "The web voice mode provides a voice-to-voice loop for Claude Engine; PanelForge routes transcript and audio state through a session adapter.",
    "problem": "Hands-free conversation needs a clear path through listening, transcription, response and spoken playback, rather than a hidden recording control.",
    "built": [
      "The web voice mode provides a voice-to-voice loop for Claude Engine; PanelForge routes transcript and audio state through a session adapter.",
      "The active phase remains visible, with audio settings close to the controls. A later correction makes audio activation an explicit choice, keeping incoming chunks quiet until the page has been enabled for sound."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Make the active voice phase visible and keep audio/TTS settings close to the session controls."
      }
    ],
    "evolution": [
      {
        "date": "2026-02-12",
        "title": "web-v6.20.0"
      },
      {
        "date": "2026-09-30",
        "title": "web-v10.20.5 — audio waits for an explicit gesture"
      }
    ],
    "sources": {
      "repo": "panel-forge and claude-engine",
      "files": [
        "resources/js/composables/voice/useVoiceSession.ts",
        "resources/js/composables/voice/claudeEngineVoiceAdapter.ts",
        "resources/js/components/chat/ChatInputVoiceMode.vue",
        "resources/js/lib/audioRuntime.ts",
        "resources/js/composables/useWebAudioPlayer.ts",
        "app/Http/Controllers/Api/TranscribeController.php",
        "app/Services/GroqTranscriptionService.php",
        "app/Services/EngineVoiceStream.php",
        "express-ai-service/src/audio/AudioManager.ts",
        "claude-engine: claude_engine/routes/stream.py"
      ],
      "status": "source-current",
      "note": "One fictional file-backed turn ran through actual PanelForge voice components and isolated server routes, Groq transcription, Claude Engine and OpenAI speech. The browser output was muted; one chunk completed and two messages persisted. The separate local three-note queue tests multi-item ordering. Neither is a physical microphone or device-routing claim.",
      "release": "web-v10.20.97"
    },
    "related": [
      "gateway-tool-profiles",
      "focus-aware-question",
      "voice-conversation-loop"
    ],
    "exhibit": {
      "title": "A recorded request. A spoken reply.",
      "caption": "Actual voice components and server pipeline in an isolated wrapper; fictional file-backed input and real provider responses.",
      "steps": [
        {
          "name": "Record the request",
          "detail": "The browser uploads a new recording of fictional stock speech."
        },
        {
          "name": "Save the reply",
          "detail": "A real model reply and one generated audio chunk complete the turn."
        }
      ],
      "choices": [
        {
          "label": "Inspect the recorded turn",
          "result": "Moonlight Bellflower.",
          "explanation": "One actual turn used the canonical voice components and server pipeline in an isolated wrapper."
        },
        {
          "label": "Inspect separate ordering",
          "result": "Three synthetic notes",
          "explanation": "The separate local audio example tests multi-item ordering without a microphone or speech service."
        }
      ]
    },
    "presentation": "voice"
  },
  {
    "id": "core-workspace-hierarchy",
    "slug": "workspace-hierarchy",
    "name": "Give a creative library a home",
    "title": "Move the project. Keep its contents together.",
    "area": "Studio",
    "date": "2026-08-31",
    "topics": [
      "Organization"
    ],
    "intro": "A project can change workspace while its scenes, panels and assigned media stay together. The recorded local example checks that the saved hierarchy survives a reload.",
    "problem": "A growing gallery needs a stable way to group projects, scenes and panels without flattening every asset into one long list.",
    "built": [
      "A per-user Workspace root sits above Project, Scene and Panel and supports moving projects while preserving hierarchy-aware gallery and API assignment.",
      "Add a protected root and backfill existing assignments so organization can grow without abandoning the old hierarchy."
    ],
    "use": [
      {
        "title": "The consequence",
        "description": "Add a protected root and backfill existing assignments so organization can grow without abandoning the old hierarchy."
      }
    ],
    "evolution": [
      {
        "date": "2026-08-31",
        "title": "web-v10.0.0"
      }
    ],
    "sources": {
      "repo": "panel-forge",
      "files": [
        "app/Models/Workspace.php",
        "resources/js/composables/useGalleryTree.ts",
        "app/Http/Controllers/GalleryController.php",
        "database/migrations/"
      ],
      "status": "source-current",
      "note": "Source and release record inspected. The recorded isolated move and reload use fictional data and one unreleased destination-dialog watcher option. Saved-row and file checks verify this fixture; mocked client tests are separate. No production availability is claimed.",
      "release": "web-v10.0.0"
    },
    "related": [
      "branching-workbench",
      "reference-to-chat",
      "workspace-hierarchy"
    ],
    "exhibit": {
      "title": "Follow the saved project move",
      "caption": "Actual isolated application · fictional local data · unreleased destination-dialog fix",
      "steps": [
        {
          "name": "Before the move",
          "detail": "Studio / Pocket Gardens / Window Garden / Afternoon light"
        },
        {
          "name": "After the move",
          "detail": "Archive / Pocket Gardens / Window Garden / Afternoon light"
        }
      ],
      "choices": [
        {
          "label": "Before the move",
          "result": "Studio / Pocket Gardens / Window Garden / Afternoon light",
          "explanation": "The panel is nested inside a scene, project and workspace."
        },
        {
          "label": "After the move",
          "result": "Archive / Pocket Gardens / Window Garden / Afternoon light",
          "explanation": "The project changes workspace; its scene and panel stay in the hierarchy."
        }
      ]
    },
    "presentation": "library"
  }
];
