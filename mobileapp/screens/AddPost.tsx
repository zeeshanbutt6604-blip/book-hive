import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import InputField from "@/components/InputField";
import Button from "@/components/Button";
import DarkTheme from "@/styles/theme";
import { Post } from "@/components/PostCard";
import { postService } from "@/services/postService";
import { authService } from "@/services/authService";
import axios from "axios";

interface AddPostScreenProps {
  onPostAdded: () => void;
  onClose: () => void;
}

const bookTypes = ["Manual", "Donate", "Referred Link"];

const AddPostScreen: React.FC<AddPostScreenProps> = ({
  onPostAdded,
  onClose,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bookType, setBookType] = useState<string>("Manual");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | undefined>();
  const [pdfFile, setPdfFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [referredLink, setReferredLink] = useState<string | undefined>();
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapBookTypeToAPI = (type: string): "pdf" | "epub" | "document" | "image" | "referred_link" => {
    switch (type) {
      case "Manual":
        return "pdf"; // Default to pdf for Manual
      case "Donate":
        return "image";
      case "Referred Link":
        return "referred_link";
      default:
        return "pdf";
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return;
    }

    // For "Referred Link" type, preview image is REQUIRED
    if (bookType === "Referred Link") {
      if (!referredLink) {
        Alert.alert("Error", "Please add a book link first");
        return;
      }
      if (!previewImage) {
        Alert.alert("Error", "Preview image is required for referred links. Please add a link to fetch the image.");
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const postData: any = {
        title: title.trim(),
        description: description.trim(),
        bookType: mapBookTypeToAPI(bookType),
      };

      if (bookType === "Referred Link") {
        postData.linkUrl = referredLink;
        postData.linkImage = previewImage;
      }

      const files: any = {};
      
      if (pdfFile) {
        files.file = {
          uri: pdfFile.uri,
          type: pdfFile.mimeType || "application/pdf",
          name: pdfFile.name || "file.pdf",
        };
      }

      if (previewImage && bookType !== "Referred Link") {
        // For non-referred links, preview image should be a file
        // But if it's a URL from link preview, we need to handle it differently
        if (previewImage.startsWith("http")) {
          // It's a URL, not a file - we'll need to download it or pass it as linkImage
          postData.linkImage = previewImage;
        } else {
          // It's a local file
          files.previewimage = {
            uri: previewImage,
            type: "image/jpeg",
            name: "preview.jpg",
          };
        }
      }

      const response = await postService.createPost(postData, files);

      if (response.success) {
        Alert.alert("Success", "Post created successfully!");
        // Reset form
        setTitle("");
        setDescription("");
        setBookType("Manual");
        setPreviewImage(undefined);
        setPdfFile(null);
        setReferredLink(undefined);
        onPostAdded();
      } else {
        Alert.alert("Error", response.message || "Failed to create post");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create post");
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchLinkPreview = async (url: string): Promise<string> => {
    setIsFetchingPreview(true);
    
    // List of CORS proxy services to try (with fallbacks)
    const proxyServices = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    ];

    const urlObj = new URL(url);
    let html = "";
    let lastError: any = null;

    // Try each proxy service
    for (const proxyUrl of proxyServices) {
      try {
        const response = await axios.get(proxyUrl, {
          timeout: 10000,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        // Handle different proxy response formats
        if (response.data) {
          if (response.data.contents) {
            // allorigins.win format
            html = response.data.contents;
          } else if (typeof response.data === 'string') {
            // Direct HTML response
            html = response.data;
          } else if (response.data.data) {
            // Some proxies wrap it
            html = response.data.data;
          }
          
          if (html) {
            break; // Success, exit loop
          }
        }
      } catch (error: any) {
        console.log(`Proxy service failed, trying next...`, error.message);
        lastError = error;
        continue; // Try next proxy
      }
    }

    // If all proxies failed, try direct fetch (may fail due to CORS, but worth trying)
    if (!html) {
      try {
        const response = await axios.get(url, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        html = response.data;
      } catch (error: any) {
        console.log("Direct fetch also failed:", error.message);
      }
    }

    // If we have HTML, parse it for images
    if (html) {
      // Try multiple methods to get an image
      let image = "";
      
      // Method 1: Open Graph image
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      if (ogImageMatch) {
        image = ogImageMatch[1].trim();
      }
      
      // Method 2: Twitter Card image
      if (!image) {
        const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
        if (twitterImageMatch) {
          image = twitterImageMatch[1].trim();
        }
      }
      
      // Method 3: First large image in the HTML
      if (!image) {
        const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi);
        if (imgMatches && imgMatches.length > 0) {
          // Find the first image that looks like a preview (not icon/favicon)
          for (const imgTag of imgMatches) {
            const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
            if (srcMatch) {
              const imgSrc = srcMatch[1].trim();
              // Skip small images, icons, and favicons
              if (!imgSrc.match(/(icon|favicon|logo|avatar|thumb|small)/i) && 
                  imgSrc.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
                image = imgSrc;
                break;
              }
            }
          }
        }
      }
      
      // Method 4: Try to get favicon from HTML
      if (!image) {
        const faviconMatch = html.match(/<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]+href=["']([^"']+)["']/i);
        if (faviconMatch) {
          image = faviconMatch[1].trim();
        }
      }

      // Handle relative image URLs
      if (image && !image.startsWith("http")) {
        try {
          if (image.startsWith("//")) {
            image = urlObj.protocol + image;
          } else if (image.startsWith("/")) {
            image = urlObj.origin + image;
          } else {
            image = urlObj.origin + "/" + image;
          }
        } catch (e) {
          // Invalid URL, try to construct from base URL
          image = urlObj.origin + "/" + image;
        }
      }

      // Clean up image URL - but keep it valid
      if (image) {
        try {
          const imgUrl = new URL(image);
          // Keep the full URL including query params (they might be needed for the image)
          image = imgUrl.href;
        } catch (e) {
          // If URL parsing fails, try to fix it
          if (!image.startsWith("http")) {
            try {
              const baseUrl = new URL(url);
              if (image.startsWith("//")) {
                image = baseUrl.protocol + image;
              } else if (image.startsWith("/")) {
                image = baseUrl.origin + image;
              } else {
                image = baseUrl.origin + "/" + image;
              }
            } catch (e2) {
              // Keep original if all else fails
            }
          }
        }
      }

      if (image) {
        setIsFetchingPreview(false);
        return image;
      }
    }
    
    // Final fallback: Use favicon from domain (always available)
    setIsFetchingPreview(false);
    try {
      return `${urlObj.origin}/favicon.ico`;
    } catch (e) {
      throw new Error("Failed to fetch preview image. Please try a different link.");
    }
  };

  const handleLinkSubmit = async () => {
    if (!linkInput.trim()) {
      Alert.alert("Error", "Please enter a link");
      return;
    }

    // Validate URL format
    let url = linkInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      Alert.alert("Error", "Please enter a valid URL");
      return;
    }

    try {
      // Fetch preview image - REQUIRED
      const previewImageUrl = await fetchLinkPreview(url);
      
      if (!previewImageUrl) {
        Alert.alert(
          "Error",
          "Could not fetch preview image from this link. Please try a different link or ensure the website has an image available."
        );
        return;
      }

      // Set both the link and the preview image (both are required)
      setReferredLink(url);
      setPreviewImage(previewImageUrl);

      setShowLinkModal(false);
      setLinkInput("");
      Alert.alert("Success", "Link and preview image added successfully!");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to fetch preview image. Please try again or use a different link."
      );
    }
  };

  const handleBookTypeChange = (type: string) => {
    setBookType(type);
    setShowTypePicker(false);
    
    if (type === "Referred Link") {
      setShowLinkModal(true);
    } else {
      // Clear referred link if switching to another type
      setReferredLink(undefined);
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your photos to select an image."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setPreviewImage(selectedImage.uri);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to pick image");
    }
  };

  const handlePdfPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        
        // Validate file type
        if (!selectedFile.name?.endsWith(".pdf")) {
          Alert.alert("Error", "Please select a PDF file");
          return;
        }

        setPdfFile(selectedFile);
        Alert.alert("Success", `PDF selected: ${selectedFile.name}`);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to pick PDF file");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[DarkTheme.colors.surface, DarkTheme.colors.background]}
        style={styles.header}
      >
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={28} color={DarkTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Post</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <InputField
          label="Book Title"
          placeholder="Enter the book title"
          value={title}
          onChangeText={setTitle}
          containerStyle={styles.input}
        />

        <InputField
          label="Description"
          placeholder="Write a short description about the book..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          containerStyle={styles.input}
        />

        <View style={styles.input}>
          <Text style={styles.label}>Book Type</Text>
          <TouchableOpacity
            style={styles.typeSelector}
            onPress={() => setShowTypePicker(!showTypePicker)}
          >
            <Text style={styles.typeSelectorText}>{bookType}</Text>
            <MaterialIcons
              name={showTypePicker ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={24}
              color={DarkTheme.colors.text}
            />
          </TouchableOpacity>
          {showTypePicker && (
            <View style={styles.typePicker}>
              {bookTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption,
                    bookType === type && styles.typeOptionSelected,
                  ]}
                  onPress={() => handleBookTypeChange(type)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      bookType === type && styles.typeOptionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.label}>Upload Book (PDF)</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePdfPick}
          >
            <MaterialIcons
              name="picture-as-pdf"
              size={32}
              color={DarkTheme.colors.primary}
            />
            <View style={styles.uploadButtonContent}>
              <Text style={styles.uploadButtonText}>
                {pdfFile ? pdfFile.name : "Choose PDF File"}
              </Text>
              {pdfFile && (
                <Text style={styles.uploadButtonSubtext}>
                  {(pdfFile.size && pdfFile.size > 0)
                    ? `Size: ${(pdfFile.size / 1024 / 1024).toFixed(2)} MB`
                    : "PDF selected"}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.uploadSection}>
          <Text style={styles.label}>Preview Image</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleImagePick}
          >
            <MaterialIcons
              name="image"
              size={32}
              color={DarkTheme.colors.primary}
            />
            <Text style={styles.uploadButtonText}>Choose Image</Text>
          </TouchableOpacity>
          {previewImage && (
            <View style={styles.previewImageContainer}>
              <Image source={{ uri: previewImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setPreviewImage(undefined)}
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={DarkTheme.colors.white}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {bookType === "Referred Link" && referredLink && (
          <View style={styles.linkDisplayContainer}>
            <Text style={styles.label}>Book Link</Text>
            <View style={styles.linkDisplay}>
              <MaterialIcons
                name="link"
                size={20}
                color={DarkTheme.colors.primary}
              />
              <Text style={styles.linkDisplayText} numberOfLines={1}>
                {referredLink}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setReferredLink(undefined);
                  setPreviewImage(undefined);
                }}
              >
                <MaterialIcons
                  name="close"
                  size={20}
                  color={DarkTheme.colors.subtext}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Button
          title={isSubmitting ? "Submitting..." : "Submit Post"}
          onPress={handleSubmit}
          disabled={isSubmitting}
          customStyle={styles.submitButton}
        />
      </ScrollView>

      {/* Link Input Modal */}
      <Modal
        visible={showLinkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowLinkModal(false);
          setLinkInput("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Book Link</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowLinkModal(false);
                  setLinkInput("");
                }}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color={DarkTheme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <InputField
                label="Link"
                placeholder="Paste the book link here..."
                value={linkInput}
                onChangeText={setLinkInput}
                containerStyle={styles.modalInput}
                autoCapitalize="none"
                keyboardType="url"
              />

              {isFetchingPreview && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
                  <Text style={styles.loadingText}>Fetching preview...</Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowLinkModal(false);
                    setLinkInput("");
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonDone]}
                  onPress={handleLinkSubmit}
                  disabled={isFetchingPreview}
                >
                  <Text style={styles.modalButtonDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
    zIndex: 1000,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: DarkTheme.colors.text,
  },
  placeholder: {
    width: 36,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  input: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: DarkTheme.colors.text,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: DarkTheme.colors.surface,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typeSelectorText: {
    fontSize: 16,
    color: DarkTheme.colors.text,
  },
  typePicker: {
    marginTop: 8,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    overflow: "hidden",
  },
  typeOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
  },
  typeOptionSelected: {
    backgroundColor: DarkTheme.colors.primary + "20",
  },
  typeOptionText: {
    fontSize: 16,
    color: DarkTheme.colors.text,
  },
  typeOptionTextSelected: {
    color: DarkTheme.colors.primary,
    fontWeight: "600",
  },
  uploadSection: {
    marginBottom: 24,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DarkTheme.colors.surface,
    borderWidth: 2,
    borderColor: DarkTheme.colors.primary,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  uploadButtonContent: {
    flex: 1,
    marginLeft: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    color: DarkTheme.colors.primary,
    fontWeight: "600",
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: DarkTheme.colors.subtext,
    marginTop: 4,
  },
  previewImageContainer: {
    position: "relative",
    marginTop: 12,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: DarkTheme.colors.border,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: DarkTheme.colors.danger || "#FF6B6B",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  submitButton: {
    marginTop: 16,
  },
  linkDisplayContainer: {
    marginBottom: 20,
  },
  linkDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DarkTheme.colors.surface,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  linkDisplayText: {
    flex: 1,
    fontSize: 14,
    color: DarkTheme.colors.text,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: DarkTheme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: DarkTheme.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalInput: {
    marginBottom: 20,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: DarkTheme.colors.subtext,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: DarkTheme.colors.surface,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: DarkTheme.colors.text,
  },
  modalButtonDone: {
    backgroundColor: DarkTheme.colors.primary,
  },
  modalButtonDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default AddPostScreen;

