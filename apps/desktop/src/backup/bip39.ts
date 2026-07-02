// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { wordlist as BIP39_ENGLISH } from "@scure/bip39/wordlists/english.js";
import {
  entropyToMnemonic as scureEntropyToMnemonic,
  mnemonicToEntropy as scureMnemonicToEntropy,
  validateMnemonic,
} from "@scure/bip39";

export function entropyToMnemonic(entropy: Uint8Array): string[] {
  return scureEntropyToMnemonic(entropy, BIP39_ENGLISH).split(" ");
}

export function mnemonicToEntropy(words: string[]): Uint8Array {
  const phrase = words.join(" ");
  if (!validateMnemonic(phrase, BIP39_ENGLISH)) {
    throw new Error("Invalid recovery phrase.");
  }
  return scureMnemonicToEntropy(phrase, BIP39_ENGLISH);
}

export function mnemonicToString(words: string[]): string {
  return words.join(" ");
}

export function stringToMnemonic(str: string): string[] {
  const words = str.trim().toLowerCase().split(/\s+/);
  if (words.length !== 24) throw new Error("Recovery phrase must have 24 words");
  return words;
}
