# BT820 MCP Server Specification

## 1. Purpose

This document defines the product and engineering specification for a Model Context Protocol (MCP) server built around the `EveApps-BT82X` repository.

The goal is to turn the BT820 SDK and sample repository into an AI-assisted developer workflow that helps users:

- find the right sample faster
- understand BT820 / EVE API symbols
- map user requirements to commands and samples
- generate minimal screen scaffolds
- validate common mistakes in BT820 application code
- generate valid build commands for supported target configurations

This MCP server is intended to support both learning and production development workflows.

---

## 2. Product Positioning

Recommended positioning names:

- BT820 Application Builder Assistant
- BT820 Sample Navigator
- BT820 API Copilot
- BT820 Board Porting Assistant

Primary value proposition:

- reduce onboarding time for new developers
- reduce repeated support / FAE effort
- improve discoverability of samples and APIs
- provide repo-grounded guidance instead of generic code generation

---

## 3. Scope

### 3.1 In Scope

The MCP server should:

1. index commands, constants, registers, and samples from the repo
2. expose repo-grounded resources to AI clients
3. provide tools for search, explanation, build guidance, and scaffold generation
4. produce deterministic, structured outputs
5. prioritize existing repo samples over invented code patterns

### 3.2 Out of Scope for V1

The MCP server should not:

1. modify the repo automatically
2. generate full production applications from scratch
3. replace the BT820 programming guide or datasheet
4. invent symbols, macros, or APIs not present in indexed source data
5. require a vector database in the first release

---

## 4. Target Users

### 4.1 Beginner Developer

Typical needs:

- “Which sample should I start from?”
- “What does this command do?”
- “How do I build for RP2040?”

### 4.2 Application Developer

Typical needs:

- “How do I build a touch menu?”
- “Which commands are involved in animation?”
- “Can you generate a minimal screen skeleton?”

### 4.3 Platform Engineer / FAE

Typical needs:

- “Which repo sample best matches this customer use case?”
- “What does `REG_TOUCH_TAG` mean?”
- “Why does this code look structurally wrong?”

---

## 5. Architecture Overview

The system consists of two major parts:

1. offline indexer
2. MCP server

### 5.1 Offline Indexer

The indexer scans the `EveApps-BT82X` repo and generates structured JSON artifacts:

- `commands.json`
- `samples.json`
- `registers.json`
- `build_matrix.json`
- `feature_graph.json`

### 5.2 MCP Server

The MCP server loads these JSON artifacts and exposes:

- resources
- tools
- prompts

Recommended implementation:

- Language: TypeScript
- Runtime: Node.js 20+
- Transport: stdio
- Data source: local JSON files

---

## 6. Repository Assumptions

The design assumes the SDK repo contains:

- common BT820 / EVE headers
- public API declarations
- sample app directories grouped by feature
- platform/display/build guidance in README or build files

Expected repo references include:

- `common/eve_hal/EVE_CoCmd.h`
- `common/eve_hal/EVE_GpuDef.h`
- `SampleApp/**`

---

## 7. Data Artifacts

## 7.1 `commands.json`

Purpose:

- represent callable API symbols and helper commands

Recommended schema:

```json
[
  {
    "name": "EVE_CoCmd_text",
    "category": "widget_text",
    "signature": "void EVE_CoCmd_text(EVE_HalContext *phost, int16_t x, int16_t y, int16_t font, uint16_t options, const char *s)",
    "summary": "Draw text using coprocessor command",
    "params": [
      {
        "name": "phost",
        "type": "EVE_HalContext*",
        "desc": "HAL context"
      }
    ],
    "related_samples": ["sampleapp_widget_buttondemo"],
    "related_features": ["text", "label", "ui"],
    "source_file": "common/eve_hal/EVE_CoCmd.h"
  }
]