import gzip
from hashlib import sha256
from pathlib import Path
from subprocess import call
from zipfile import ZipFile

import typer
import xxtea

app = typer.Typer()


@app.command()
def extract(apk: Path, key: str, out_dir: Path = Path("out_jsc")):
    """
    Decrypt using `key` and save .jsc files from `apk`
    """
    zip_file = ZipFile(apk)
    jsc_files = [
        file.filename for file in zip_file.filelist if file.filename.endswith(".jsc")
    ]
    sources = [
        gzip.decompress(xxtea.decrypt(zip_file.open(file).read(), key))
        for file in jsc_files
    ]

    out_dir.mkdir(exist_ok=True)
    for filename, source in zip(jsc_files, sources):
        (out_dir / Path("/".join(filename.split("/")[:-1]))).mkdir(
            parents=True, exist_ok=True
        )
        with open(out_dir / filename, "wb+") as f:
            f.write(source)


@app.command()
def replace(apk: Path, jsc_dir: Path = Path("out_jsc"), script_name: str = "index.js"):
    """
    Generate Frida script to replace .jsc files in `apk` using sources from `jsc_dir`
    """
    zip_file = ZipFile(apk)
    jsc_files = [
        file.filename for file in zip_file.filelist if file.filename.endswith(".jsc")
    ]
    encrypted_hashes = [
        sha256(zip_file.open(file).read()).hexdigest() for file in jsc_files
    ]
    gzipped_sources = [
        list(gzip.compress(open(jsc_dir / file, "rb").read())) for file in jsc_files
    ]

    with open("src/index.ts", encoding="utf8") as f:
        script = f.read()
        script = script.replace(
            "const ENCRYPTED_HASHES: string[] = [];",
            f"const ENCRYPTED_HASHES = {str(encrypted_hashes)};",
        )
        script = script.replace(
            "const GZIPPED_SOURCES: number[][] = [];",
            f"const GZIPPED_SOURCES = {str(gzipped_sources)};",
        )
    with open(".script.ts", "w+", encoding="utf8") as f:
        f.write(script)

    assert (
        call(
            [
                "npx",
                "esbuild",
                "--bundle",
                ".script.ts",
                f"--outfile={script_name}",
                "--minify",
            ]
        )
        == 0
    )
    Path(".script.ts").unlink()
    print(f"Frida script is ready at {script_name}")


if __name__ == "__main__":
    app()
