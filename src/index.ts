const ENCRYPTED_HASHES: string[] = [];
const GZIPPED_SOURCES: number[][] = [];

function main(module: Module) {
  const malloc = new NativeFunction(
    Module.getExportByName(null, "malloc"),
    "pointer",
    ["int"],
  );
  const xxtea_decrypt = module.getExportByName("xxtea_decrypt");
  const xxtea_decrypt_fn = new NativeFunction(xxtea_decrypt, "pointer", [
    "pointer",
    "int",
    "pointer",
    "int",
    "pointer",
  ]);

  Interceptor.replace(
    xxtea_decrypt,
    new NativeCallback(
      function (
        encryptedData: NativePointer,
        encryptedLen: number,
        key: NativePointer,
        keyLen: number,
        outLen: NativePointer,
      ) {
        const encryptedBuffer = encryptedData.readByteArray(encryptedLen)!;
        const hash = Checksum.compute("sha256", encryptedBuffer);
        const index = ENCRYPTED_HASHES.indexOf(hash);
        if (index != -1) {
          console.log("Matched hash, replacing return value");
          const source = GZIPPED_SOURCES[index];
          outLen.writeU32(source.length);
          const buffer = malloc(source.length); // We need to leak memory, `Memory.alloc` will GC it and cause crash
          buffer.writeByteArray(source);
          console.log(`allocated ${source.length} bytes`);

          return buffer;
        } else
          return xxtea_decrypt_fn(
            encryptedData,
            encryptedLen,
            key,
            keyLen,
            outLen,
          );
      },
      "pointer",
      ["pointer", "int", "pointer", "int", "pointer"],
    ),
  );

  Interceptor.flush();
}

const i = setInterval(() => {
  const module = Process.findModuleByName("libcocos2djs.so");
  if (!module) return;

  clearInterval(i);
  main(module);
}, 50);
