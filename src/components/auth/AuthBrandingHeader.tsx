import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { GirisMarkasi } from '../../types';
import { Colors } from '../../constants/colors';

interface Props {
  marka: GirisMarkasi;
  /** Kayıt ekranında true — başlık "Hesap Oluşturun" gösterir. */
  kayitModu?: boolean;
}

export default function AuthBrandingHeader({ marka, kayitModu }: Props) {
  if (kayitModu) {
    return (
      <View style={styles.markaBlok}>
        <MarkaGorsel marka={marka} />
        <Text style={styles.kayitBaslik}>Hesap Oluşturun</Text>
        <Text style={styles.altBaslik}>
          {marka.tip === 'dernek'
            ? `${marka.ad} bünyesinde üyelik için hesap oluşturun`
            : 'Dernek yönetim platformuna katılın'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.markaBlok}>
      <MarkaGorsel marka={marka} />
      {marka.tip === 'dernek' && (
        <>
          <Text style={styles.dernekBaslik} numberOfLines={2}>{marka.ad}</Text>
          <Text style={styles.altBaslik}>Üye girişi</Text>
        </>
      )}
      {marka.tip === 'genel' && (
        <>
          <Text style={styles.genelBaslik}>Dernek Yönetim</Text>
          <Text style={styles.altBaslik}>Üye girişi yapın veya kayıt olun</Text>
        </>
      )}
    </View>
  );
}

function MarkaGorsel({ marka }: { marka: GirisMarkasi }) {
  if (marka.tip === 'dernek' && marka.logoUri) {
    return (
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: marka.logoUri }}
          style={styles.logoImage}
          resizeMode="contain"
          accessibilityLabel={`${marka.ad} logosu`}
        />
      </View>
    );
  }
  return (
    <View style={[styles.logoContainer, styles.yerTutucu]}>
      <Ionicons name="business" size={64} color={Colors.primaryLight} accessibilityLabel="Dernek" />
    </View>
  );
}

const styles = StyleSheet.create({
  markaBlok: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 128,
    height: 128,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yerTutucu: {
    backgroundColor: Colors.surfaceVariant,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  genelBaslik: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryLight,
    letterSpacing: 1,
    textAlign: 'center',
  },
  dernekBaslik: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.gold,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  kayitBaslik: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
  },
  altBaslik: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
