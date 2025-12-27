
import sys
import os

try:
    import adi_lims
    print(f"adi_lims: {adi_lims.__file__}")
except ImportError as e:
    print(f"ImportError adi_lims: {e}")

try:
    import adi_lims.adi_lims
    print(f"adi_lims.adi_lims: {adi_lims.adi_lims.__file__}")
except ImportError as e:
    print(f"ImportError adi_lims.adi_lims: {e}")
except Exception as e:
    print(f"Error importing adi_lims.adi_lims: {e}")
