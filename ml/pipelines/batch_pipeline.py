"""
batch_pipeline.py
-----------------
Chunked batch inference for large files (millions of rows).
Processes the input in configurable chunks to keep memory bounded.

Usage
-----
  python pipelines/batch_pipeline.py \
      --input  data/raw/large_test.csv \
      --output data/predictions/batch_output.csv \
      --chunk-size 50000
"""

import argparse
import logging
import sys
import time
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.preprocessing.validation import validate
from src.preprocessing.feature_engineering import preprocess
from src.model.predictor import load_model, predict

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("batch_pipeline")


def run_batch(
    input_path: str,
    output_path: str,
    model_path: str | None = None,
    chunk_size: int = 50_000,
) -> None:
    """Process a large CSV in chunks and write predictions incrementally."""
    t0 = time.time()
    logger.info("=== Batch Pipeline Start | chunk_size=%d ===", chunk_size)

    model = load_model(model_path)

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    header_written = False
    total_rows = 0
    chunk_idx = 0

    for chunk in pd.read_csv(input_path, chunksize=chunk_size):
        chunk_idx += 1
        logger.info("Processing chunk %d | rows=%d", chunk_idx, len(chunk))

        # Validate first chunk only (schema check, not full stats)
        if chunk_idx == 1:
            validate(chunk, raise_on_error=True)

        features = preprocess(chunk)
        preds = predict(features, model)

        preds.to_csv(out, mode="a", header=not header_written, index=False)
        header_written = True
        total_rows += len(preds)

    elapsed = time.time() - t0
    logger.info(
        "=== Batch Pipeline Complete | total_rows=%d | %.2fs ===", total_rows, elapsed
    )


def main():
    parser = argparse.ArgumentParser(description="Chunked batch inference pipeline.")
    parser.add_argument("--input",      required=True)
    parser.add_argument("--output",     required=True)
    parser.add_argument("--model",      default=None)
    parser.add_argument("--chunk-size", type=int, default=50_000)
    args = parser.parse_args()

    run_batch(
        input_path=args.input,
        output_path=args.output,
        model_path=args.model,
        chunk_size=args.chunk_size,
    )


if __name__ == "__main__":
    main()