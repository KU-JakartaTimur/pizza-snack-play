import { describe, expect, test } from "bun:test";
import { deliver, type MessageSender } from "./delivery";

/**
 * Kegagalan harus terisolasi per penerima.
 *
 * Yang diuji di sini bukan "pesan terkirim", melainkan **apa yang terjadi
 * sesudah satu penerima gagal**: apakah sisanya tetap dikirim, dan apakah
 * jumlahnya dilaporkan dengan benar. Batch yang berhenti di tengah membuat
 * separuh kelas tidak pernah menerima pengingat, dan tidak ada yang tahu.
 */

function sender(behaviour: (destination: string) => void): MessageSender {
  return {
    async send(message) {
      behaviour(message.destination);
      return "Sukses";
    },
  };
}

describe("deliver", () => {
  test("semua berhasil dihitung apa adanya", async () => {
    const sent: string[] = [];
    const outcome = await deliver(
      sender((destination) => sent.push(destination)),
      [
        { destination: "081111111111", message: "a" },
        { destination: "082222222222", message: "b" },
      ],
    );

    expect(outcome).toEqual({ sent: 2, failed: 0, failures: [] });
    expect(sent).toEqual(["081111111111", "082222222222"]);
  });

  test("satu penerima gagal tidak menghentikan sisanya", async () => {
    const attempted: string[] = [];
    const outcome = await deliver(
      sender((destination) => {
        attempted.push(destination);
        if (destination === "082222222222") {
          throw new Error("Nomor tidak terdaftar di WhatsApp");
        }
      }),
      [
        { destination: "081111111111", message: "a" },
        { destination: "082222222222", message: "b" },
        { destination: "083333333333", message: "c" },
      ],
    );

    expect(attempted).toEqual([
      "081111111111",
      "082222222222",
      "083333333333",
    ]);
    expect(outcome.sent).toBe(2);
    expect(outcome.failed).toBe(1);
    expect(outcome.failures).toEqual([
      {
        destination: "082222222222",
        reason: "Nomor tidak terdaftar di WhatsApp",
      },
    ]);
  });

  test("alasan kegagalan dipotong supaya tidak memenuhi kolom riwayat", async () => {
    const outcome = await deliver(
      sender(() => {
        throw new Error("x".repeat(1000));
      }),
      [{ destination: "081111111111", message: "a" }],
    );

    expect(outcome.failures[0].reason).toHaveLength(300);
    expect(outcome.failures[0].reason.endsWith("…")).toBe(true);
  });

  test("error yang bukan Error tetap dilaporkan sebagai teks", async () => {
    const outcome = await deliver(
      {
        async send() {
          throw "ditolak gateway";
        },
      },
      [{ destination: "081111111111", message: "a" }],
    );

    expect(outcome.failures[0].reason).toBe("ditolak gateway");
  });

  test("daftar kosong tidak mengirim apa pun", async () => {
    let called = false;
    const outcome = await deliver(
      sender(() => {
        called = true;
      }),
      [],
    );

    expect(called).toBe(false);
    expect(outcome).toEqual({ sent: 0, failed: 0, failures: [] });
  });
});
