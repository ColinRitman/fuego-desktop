# QREncode CMake Configuration
# This file provides CMake configuration for the QR code encoding library

# Set QR encode source directories
set(QRENCODE_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/libqrencode)
set(QRENCODE_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/libqrencode)

# Add QR encode include directories
include_directories(${QRENCODE_INCLUDE_DIR})

# QR encode source files
set(QRENCODE_SOURCES
    ${QRENCODE_SOURCE_DIR}/qrencode.c
    ${QRENCODE_SOURCE_DIR}/qrenc.c
    ${QRENCODE_SOURCE_DIR}/qrinput.c
    ${QRENCODE_SOURCE_DIR}/qrspec.c
    ${QRENCODE_SOURCE_DIR}/mask.c
    ${QRENCODE_SOURCE_DIR}/mmask.c
    ${QRENCODE_SOURCE_DIR}/mqrspec.c
    ${QRENCODE_SOURCE_DIR}/split.c
    ${QRENCODE_SOURCE_DIR}/rsecc.c
    ${QRENCODE_SOURCE_DIR}/bitstream.c
)

# Create QR encode library
add_library(qrencode STATIC ${QRENCODE_SOURCES})

# Set compile definitions for QR encode
target_compile_definitions(qrencode PRIVATE
    MAJOR_VERSION=4
    MINOR_VERSION=1
    MICRO_VERSION=2
    VERSION="4.1.2"
    STATIC_IN_RELEASE=static
)