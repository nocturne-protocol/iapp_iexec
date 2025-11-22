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

  %% Optional: style arrows for clarity
  %%linkStyle 3 stroke:#f66,stroke-width:3px,%%stroke-dasharray: 5 5;