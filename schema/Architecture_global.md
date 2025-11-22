```mermaid

flowchart LR
  %% Main actors
  CLIENT[Client / dApp]

  subgraph SMIN["Source Chains (L1 / L2)"]
    ARG1["Set up on chain requesters orders"]
  end

  %% Secure enclave process
  subgraph IAPP["TEE iApp - Off-chain"]
    F5["Transaction management:
- Decrypt amount
- Read balances
- Update balance
- Re-encrypt
- Submit updated balances"]
  end

  %% Blockchain with on-chain state
  subgraph CHAIN["Blockchain / PrivateERC20"]
    C2[readBalance]
    C3[updateBalance]
    STATE[(Encrypted balances)]
  end

  %% Flow
  CLIENT --> SMIN
  ARG1 -. "Trigger confidential transfer" .-> F5
  C2 -. "read" .-> F5
  F5 -. "Tx." .-> C3
  C3 --> STATE
  STATE -.-> C2

  %% Color styling (GitHub Mermaid may ignore color, but it's valid)
  style CLIENT fill:#D5F5E3,stroke:#1ABC9C,stroke-width:2px,color:#000000
  style ARG1 fill:#AED6F1,stroke:#2980B9,stroke-width:2px,color:#000000
  style F5 fill:#FCF3CF,stroke:#F9E79F,stroke-width:2px,color:#000000
  style C2 fill:#EBDEF0,stroke:#6C3483,stroke-width:2px,color:#000000
  style C3 fill:#EBDEF0,stroke:#6C3483,stroke-width:2px,color:#000000
  style STATE fill:#D6DBDF,stroke:#626567,stroke-width:2px,color:#000000
