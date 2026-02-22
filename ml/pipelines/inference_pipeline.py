"""
inference_pipeline.py
---------------------
End-to-end pipeline: raw CSV → validated → features → predictions → output CSV.

Usage
-----
  python pipelines/inference_pipeline.py \
      --input  data/raw/test.csv \
      --output data/predictions/output.csv \
      --model  model.joblib
"""

import argparse
import logging
import sys
import time
from pathlib import Path

import pandas as pd

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.preprocessing.validation import validate
from src.preprocessing.feature_engineering import preprocess
from src.model.predictor import load_model, predict

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("inference_pipeline")


def run_inference(
    input_path: str,
    output_path: str,
    model_path: str | None = None,
    skip_validation: bool = False,
) -> pd.DataFrame:
    """
    Full inference pipeline.

    Parameters
    ----------
    input_path       : path to raw input CSV
    output_path      : where to write prediction CSV
    model_path       : path to model.joblib (falls back to env / default)
    skip_validation  : bypass schema checks (not recommended in production)

    Returns
    -------
    predictions DataFrame
    """
    t0 = time.time()
    logger.info("=== Inference Pipeline Start ===")

    # 1. Load raw data
    logger.info("Loading input data from %s", input_path)
    df_raw = pd.read_csv(input_path)
    logger.info("Loaded %d rows, %d columns", *df_raw.shape)

    # 2. Validate
    if not skip_validation:
        logger.info("Running data validation...")
        validate(df_raw, raise_on_error=True)
    else:
        logger.warning("Validation skipped (skip_validation=True)")

    # 3. Feature engineering
    logger.info("Running feature engineering...")
    df_features = preprocess(df_raw)

    # 4. Load model
    model = load_model(model_path)

    # 5. Predict
    logger.info("Running inference...")
    predictions = predict(df_features, model)

    # 6. Save output
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    predictions.to_csv(out, index=False)
    logger.info("Predictions saved to %s", out)

    elapsed = time.time() - t0
    logger.info("=== Inference Pipeline Complete | %.2fs ===", elapsed)
    return predictions


def main():
    parser = argparse.ArgumentParser(description="Run the coverage bundle inference pipeline.")
    parser.add_argument("--input",  required=True, help="Path to raw input CSV")
    parser.add_argument("--output", required=True, help="Path for output predictions CSV")
    parser.add_argument("--model",  default=None,  help="Path to model.joblib")
    parser.add_argument("--skip-validation", action="store_true",
                        help="Skip data validation (not recommended)")
    args = parser.parse_args()

    run_inference(
        input_path=args.input,
        output_path=args.output,
        model_path=args.model,
        skip_validation=args.skip_validation,
    )


if __name__ == "__main__":
    main()