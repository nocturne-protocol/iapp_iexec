# Nocturne iApp

## Command: 

`iapp test --args "<encrypted_amount> <sender_address> <recipient_address> <chainId>"`

Test with an ECIES-encrypted payload for a specified recipient on a specific chain.  

Arguments:

- `<encrypted_data>`: The hex-encoded encrypted data (starts with `0x`).
- `<sender_address>`: Address of the data sender.
- `<recipient_address>`: Address of the intended recipient.
- `<chainId>`: Chain ID for the target blockchain network.

**Supported Chain IDs:**
- `421614`: Arbitrum Sepolia
- `84532`: Base Sepolia
- `11155111`: Sepolia

**Example:**

```bash
iapp test --args '"0x0468…e99e" "0x1234567890abcdef1234567890abcdef12345678" "0xfedcba0987654321fedcba0987654321fedcba09" "421614"'
```

The app will attempt to decrypt the data using the recipient's configured private key and show the result or an error.

## iExec Iapp 
- V0 : https://explorer.iex.ec/bellecour/app/0xea5955348c63795726f0acb4abbbfd1c9df75090
