```mermaid

flowchart LR
  %% Main actors
  CLIENT[Client / dApp]
  ARG["encryptedAmount,\nsenderAddress,\nreceiverAddress"]

  %% Secure enclave process
  subgraph IAPP["TEE iApp - Off-chain"]
    F5["Transaction management:\n- Decrypt amount\n- Read balances\n- Update balance\n- Re-encrypt\n- Submit updated balances"]
  end

  %% Secrets management
  subgraph IEXEC["Secret Management Service"]
    SEC1[Balance decryption and private key]
  end

  %% Blockchain with on-chain state
  subgraph CHAIN["Blockchain / PrivateERC20"]
    C2[readBalance]
    C3[updateBalance]
    STATE[(Balances Encrypted)]
  end

  %% Flow
  CLIENT --> ARG
  ARG -. "Trigger confidential execution" .-> F5
  SEC1 -. "Key required" .-> F5
  C2 -. "read" .-> F5
  F5 -. "Tx." .-> C3
  C3 --> STATE
  STATE -.-> C2

  %% Color styling (force text in black with color:#000000)
  style CLIENT fill:#D5F5E3,stroke:#1ABC9C,stroke-width:2px,color:#000000
  style ARG fill:#AED6F1,stroke:#2980B9,stroke-width:2px,color:#000000
  style F5 fill:#FCF3CF,stroke:#F9E79F,stroke-width:2px,color:#000000
  style SEC1 fill:#FADBD8,stroke:#E74C3C,stroke-width:2px,color:#000000
  style C2 fill:#EBDEF0,stroke:#6C3483,stroke-width:2px,color:#000000
  style C3 fill:#EBDEF0,stroke:#6C3483,stroke-width:2px,color:#000000
  style STATE fill:#D6DBDF,stroke:#626567,stroke-width:2px,color:#000000
