```mermaid

flowchart LR
  %% Main actors
  CLIENT[Client / dApp]
  ARG@{ shape: lean-r, label: "encryptedAmount,\nsenderAddress,\nreceiverAddress" }

  %% Secure enclave process
  subgraph IAPP["TEE iApp - Off-chain "]
    F5@{ shape: rounded, label: "Transaction management: Decrypt amount\nRead balances\n update Balance\nRe-encrypt\nSubmit updated balances" }
  end

  %% Secrets management
  subgraph IEXEC["Secret Management Service"]
    SEC1@{ shape: cyl, label: "Balance decryption and private key" }
  end

  %% Blockchain with on-chain state
  subgraph CHAIN["Blockchain / PrivateERC20"]
    C2@{ shape: lean-r, label: "readBalance" }
    C3@{ shape: lean-r, label: "updateBalance" }
    STATE@{ shape: cyl, label: "Balances [Encrypted]" }
  end

  %% Flow
  CLIENT --> ARG
  ARG -. "Trigger confidential execution" .-> F5
  SEC1 -. "Key required" .-> F5
  C2 -. "read" .-> F5
  F5 -. "Tx." .-> C3
  C3 --> STATE
  STATE -.-> C2

  %% Color styling
  style CLIENT fill:#D5F5E3,stroke:#1ABC9C,stroke-width:2px
  style ARG fill:#AED6F1,stroke:#2980B9,stroke-width:2px
  style F5 fill:#FCF3CF,stroke:#F9E79F,stroke-width:2px
  style SEC1 fill:#FADBD8,stroke:#E74C3C,stroke-width:2px
  style C2 fill:#EBDEF0,stroke:#6C3483,stroke-width:2px
  style C3 fill:#EBDEF0,stroke:#6C3483,stroke-width:2px
  style STATE fill:#D6DBDF,stroke:#626567,stroke-width:2px

  %% Optional: style subgraph label backgrounds a bit darker (Mermaid's ability is limited for subgraph titles, so this is mostly for nodes)