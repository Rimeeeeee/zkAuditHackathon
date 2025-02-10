# Directories for build and setup files
BUILD_DIR := ./build
SETUP_DIR := ./setup
CURVE := bn128  # Using bn128 curve

# Default target
all: setup

# Step 1: Generate initial powersoftau phase 0
$(BUILD_DIR)/pot8_0000.ptau:
	@ mkdir -p $(BUILD_DIR)
	snarkjs powersoftau new $(CURVE) 12 $(BUILD_DIR)/pot8_0000.ptau

# Step 2: Contribute to powersoftau phase 1
$(BUILD_DIR)/pot8_0001.ptau: $(BUILD_DIR)/pot8_0000.ptau
	snarkjs powersoftau contribute $(BUILD_DIR)/pot8_0000.ptau $(BUILD_DIR)/pot8_0001.ptau --name="First contribution"

# Step 3: Apply beacon to powersoftau phase 1
$(BUILD_DIR)/pot8_beacon.ptau: $(BUILD_DIR)/pot8_0001.ptau
	snarkjs powersoftau beacon $(BUILD_DIR)/pot8_0001.ptau $(BUILD_DIR)/pot8_beacon.ptau 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"

# Step 4: Prepare phase 2 of powersoftau
$(BUILD_DIR)/pot8_final.ptau: $(BUILD_DIR)/pot8_beacon.ptau
	snarkjs powersoftau prepare phase2 $(BUILD_DIR)/pot8_beacon.ptau $(BUILD_DIR)/pot8_final.ptau

# Step 5: Generate R1CS from the circuit
$(BUILD_DIR)/circuit.r1cs: circuit.circom
	@ mkdir -p $(BUILD_DIR)
	circom --inspect -p $(CURVE) -o $(BUILD_DIR) --r1cs circuit.circom

# Step 6: Generate WASM file for the circuit
$(BUILD_DIR)/circuit.wasm: circuit.circom
	@ mkdir -p $(BUILD_DIR)
	circom --inspect -p $(CURVE) -o $(BUILD_DIR) --wasm circuit.circom; mv $(BUILD_DIR)/circuit_js/circuit.wasm $(BUILD_DIR)/

# Step 7: Setup the first zkey for the circuit
$(BUILD_DIR)/circuit_0000.zkey: $(BUILD_DIR)/circuit.r1cs $(BUILD_DIR)/pot8_final.ptau
	snarkjs groth16 setup $(BUILD_DIR)/circuit.r1cs $(BUILD_DIR)/pot8_final.ptau $(BUILD_DIR)/circuit_0000.zkey

# Step 8: Contribute to the zkey
$(BUILD_DIR)/circuit_0001.zkey: $(BUILD_DIR)/circuit_0000.zkey
	snarkjs zkey contribute $(BUILD_DIR)/circuit_0000.zkey $(BUILD_DIR)/circuit_0001.zkey --name="1st Contributor Name"

# Step 9: Apply beacon to the final zkey
$(BUILD_DIR)/circuit_final.zkey: $(BUILD_DIR)/circuit_0001.zkey
	snarkjs zkey beacon $(BUILD_DIR)/circuit_0001.zkey $(BUILD_DIR)/circuit_final.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon phase2"

# Step 10: Export the verification key from the zkey
$(BUILD_DIR)/verification_key.json: $(BUILD_DIR)/circuit_final.zkey
	snarkjs zkey export verificationkey $(BUILD_DIR)/circuit_final.zkey $(BUILD_DIR)/verification_key.json

# Step 11: Copy final setup files to setup directory
$(SETUP_DIR)/circuit_final.zkey: $(BUILD_DIR)/circuit_final.zkey
	@ mkdir -p $(SETUP_DIR)
	cp $(BUILD_DIR)/circuit_final.zkey $(SETUP_DIR)

$(SETUP_DIR)/circuit.wasm: $(BUILD_DIR)/circuit.wasm
	@ mkdir -p $(SETUP_DIR)
	cp $(BUILD_DIR)/circuit.wasm $(SETUP_DIR)

$(SETUP_DIR)/verification_key.json: $(BUILD_DIR)/verification_key.json
	@ mkdir -p $(SETUP_DIR)
	cp $(BUILD_DIR)/verification_key.json $(SETUP_DIR)

# Final setup step
setup: $(SETUP_DIR)/circuit_final.zkey $(SETUP_DIR)/circuit.wasm $(SETUP_DIR)/verification_key.json

# Clean up the build directory
clean:
	rm -rf $(BUILD_DIR)

# Clean up both build and setup directories
dist-clean: clean
	rm -rf $(SETUP_DIR)

.PHONY: all setup clean dist-clean