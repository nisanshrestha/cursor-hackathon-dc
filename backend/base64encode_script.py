"""
Simple script to read a file and return its base64 encoded string
"""
import base64
import sys
import os


def encode_file_to_base64(file_path):
    """
    Read a file and return its base64 encoded string
    
    Args:
        file_path: Path to the file to encode
        
    Returns:
        Base64 encoded string
    """
    try:
        with open(file_path, 'rb') as file:
            file_content = file.read()
            encoded = base64.b64encode(file_content)
            return encoded.decode('utf-8')
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print("Usage: python encode_file.py <file_path>")
        print("Example: python encode_file.py image.png")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' does not exist")
        sys.exit(1)
    
    encoded_string = encode_file_to_base64(file_path)
    
    print(f"File: {file_path}")
    print(f"Size: {os.path.getsize(file_path)} bytes")
    print(f"\nBase64 encoded string:")
    print(encoded_string)
    
    # Optionally save to a file
    output_file = f"{file_path}.b64"
    with open(output_file, 'w') as f:
        f.write(encoded_string)
    print(f"\nEncoded string also saved to: {output_file}")


if __name__ == "__main__":
    main()