import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, MessageCircle, Send } from 'lucide-react-native';

import { Avatar } from '@/components/Avatar';
import { ProductImage } from '@/components/ProductImage';
import { categoryLabel, getProduct } from '@/core/catalog';
import { getPostById, type Comment } from '@/core/activity';
import { getPerson } from '@/core/social';
import { palette, radius, space } from '@/core/theme';
import { useProfile } from '@/data/profile-store';

// Post detail — a friend's ranking with its comment thread. Ported from the web PostDetail.
// Likes + new comments are local (demo); they persist to Supabase in a later pass.
export default function PostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const post = useMemo(() => (id ? getPostById(id) : undefined), [id]);

  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');

  const meName = profile?.display_name ?? 'You';
  const meAvatar = profile?.avatar_url ?? undefined;

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top + space(4), paddingHorizontal: space(5) }}>
        <Pressable onPress={() => router.back()} hitSlop={8}><ArrowLeft size={22} color={palette.muted} /></Pressable>
        <Text style={{ marginTop: space(6), fontSize: 15, color: palette.muted }}>This post isn't available.</Text>
      </View>
    );
  }

  const product = post.productId ? getProduct(post.productId) : undefined;
  const comments = [...post.seed, ...added];
  const likeCount = post.likes + (liked ? 1 : 0);
  const first = post.person.name.split(' ')[0];

  const resolveAuthor = (personId: string): { name: string; tint?: string; avatar?: string } => {
    if (personId === 'me') return { name: meName, tint: undefined, avatar: meAvatar };
    const p = getPerson(personId);
    return p ? { name: p.name, tint: p.tint } : { name: 'Someone' };
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setAdded((cs) => [...cs, { id: `me-${Date.now()}`, personId: 'me', text, timeAgo: 'now' }]);
    setDraft('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: insets.top + space(4), paddingHorizontal: space(5), paddingBottom: space(2) }}>
        <Pressable onPress={() => router.back()} hitSlop={8}><ArrowLeft size={22} color={palette.ink} /></Pressable>
        <Text style={{ fontSize: 18, fontWeight: '800', color: palette.ink }}>Post</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space(5), paddingBottom: space(6) }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Post card */}
        <View style={{ borderRadius: radius.lg, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, padding: space(4) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable
              disabled={post.personId === 'me'}
              onPress={() => router.push({ pathname: '/person/[id]', params: { id: post.personId } })}
            >
              <Avatar name={post.person.name} tint={post.person.tint} size={44} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: palette.ink, lineHeight: 20 }}>
                <Text style={{ fontWeight: '700' }}>{first}</Text>
                <Text style={{ color: palette.muted }}> {post.action}</Text>
                {product ? <Text style={{ fontWeight: '700' }}> {product.name}</Text> : null}
              </Text>
              <Text style={{ fontSize: 12, color: palette.muted, marginTop: 1 }}>{post.timeAgo}</Text>
            </View>
            {post.badge ? (
              <View style={{ borderRadius: 999, borderWidth: 2, borderColor: post.badge.color, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: post.badge.color }}>{post.badge.text}</Text>
              </View>
            ) : null}
          </View>

          {product ? (
            <Pressable
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
              style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, backgroundColor: palette.bg, padding: 10 }}
            >
              <ProductImage id={product.id} brand={product.brand} image={product.image} width={48} height={48} radius={12} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: palette.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>{categoryLabel(product.category)}</Text>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '700', color: palette.ink }}>{product.name}</Text>
                <Text numberOfLines={1} style={{ fontSize: 12, color: palette.muted }}>{product.brand}</Text>
              </View>
              {product.price ? <Text style={{ fontSize: 13, fontWeight: '700', color: palette.ink }}>${product.price}</Text> : null}
            </Pressable>
          ) : null}

          {post.review ? <Text style={{ marginTop: 12, fontSize: 15, color: palette.ink, lineHeight: 21 }}>{post.review}</Text> : null}

          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 20, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12 }}>
            <Pressable onPress={() => setLiked((v) => !v)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Heart size={19} color={liked ? palette.tierF : palette.ink} fill={liked ? palette.tierF : 'transparent'} />
              <Text style={{ fontSize: 13, color: palette.muted }}>{likeCount}</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MessageCircle size={19} color={palette.ink} />
              <Text style={{ fontSize: 13, color: palette.muted }}>{comments.length}</Text>
            </View>
          </View>
        </View>

        {/* Comments */}
        <Text style={{ marginTop: space(5), marginBottom: 4, fontSize: 13, fontWeight: '800', color: palette.muted, textTransform: 'uppercase', letterSpacing: 1.2 }}>Comments</Text>
        {comments.length === 0 ? (
          <Text style={{ paddingVertical: 16, fontSize: 13.5, color: palette.muted }}>No comments yet. Be the first.</Text>
        ) : (
          <View>
            {comments.map((c, i) => {
              const a = resolveAuthor(c.personId);
              return (
                <View key={c.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: palette.line }}>
                  <Pressable
                    disabled={c.personId === 'me'}
                    onPress={() => router.push({ pathname: '/person/[id]', params: { id: c.personId } })}
                  >
                    <Avatar name={a.name} src={a.avatar} tint={a.tint} size={32} />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: palette.ink }}>
                      <Text style={{ fontWeight: '700' }}>{a.name.split(' ')[0]}</Text>
                      <Text style={{ fontSize: 11, color: palette.muted }}>  {c.timeAgo}</Text>
                    </Text>
                    <Text style={{ fontSize: 14, color: palette.ink, lineHeight: 19, marginTop: 1 }}>{c.text}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add a comment */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: palette.surface, paddingHorizontal: space(4), paddingTop: space(3), paddingBottom: insets.bottom + space(3) }}>
          <Avatar name={meName} src={meAvatar} size={32} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={send}
            placeholder="Add a comment…"
            placeholderTextColor={palette.muted}
            maxLength={200}
            returnKeyType="send"
            style={{ flex: 1, borderRadius: 999, backgroundColor: 'rgba(46,46,46,0.05)', paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: palette.ink }}
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', opacity: draft.trim() ? 1 : 0.4 }}
          >
            <Send size={17} color={palette.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
