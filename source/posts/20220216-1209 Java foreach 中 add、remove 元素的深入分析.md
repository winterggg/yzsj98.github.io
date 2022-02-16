```

title: Java foreach 中 add、remove 元素的深入分析

date: 2022.02.16 12:09

tags: Java 分析

description: 看代码时偶尔发现的 Java 使用问题

```

今天看 Java 源码的时候发现如下一段代码：

```java
List<ShopCartBo> shopCartList = /** 从 Redis 中取购物车 List **/
for (ShopcartBo sc: shopcartList) {
    if (sc.getSpecId().equals(itemSpecId)) {
        shopcartList.remove(sc);
        break;
    }
}
```

这是某项目购物车业务代码里的一小段，注意作者直接在 List 的 `foreach` 语法里调用的该 List 的 `remove` 方法。乍一看，直觉上认为这样写是不好的。但作者既然这样写了，应该也经过了简单测试，说明这段代码至少在某些 case 是符合预期的。那究竟可不可以这样用呢？如果不可以，又有那些 fail cases？

为了解决这些疑惑，于是对 Java 的 `foreach` 里能否 add/remove 元素进行了一些探索，总结为本文。

## 实验

《阿里巴巴Java开发手册v1.4.0》有这样一条编程规约：

```
7. 【强制】不要在 foreach 循环里进行元素的 remove/add 操作。remove 元素请使用 Iterator
方式，如果并发操作，需要对 Iterator 对象加锁。
```

实验如下：

正例，输出：`[2]`，结果正常：

```java
List<String> list = new ArrayList<>();
list.add("1");
list.add("2");
```

```java
Iterator<String> iterator = list.iterator();
while (iterator.hasNext()) {
    String item = iterator.next();
    if (item.equals("1")) {
        iterator.remove();
    }
}
System.out.println(list);
```

反例1，`foreach` 里删除  `1` ，输出：`[2]`，结果正常：

```java
for (String item : list) {
    if ("1".equals(item)) {
        list.remove(item);
    }
}
```

反例2，`foreach` 里删除  `2` ，报 `ConcurrentModificationException`：

```java
for (String item : list) {
    if ("2".equals(item)) {
        list.remove(item);
    }
}
```

问题来了，为什么 remove `1` 正常而 remove `2` 异常呢？

通过异常的 stack 导出 UML sequence 图如下：

<img src="/res/2022-02-16_15-40-18.jpg">

可以看到，程序终止于 `ArrayList` 的 `Itr` 类 的 `next` 方法里的 `checkForComodification` 方法。

具体的，通过反编译，删除 “2” 的 case 的代码会被编译理解为如下代码：

```java
Iterator var2 = list.iterator();

while(var2.hasNext()) {
    String item = (String)var2.next(); // 报错的函数
    if ("2".equals(item)) {
        list.remove(item);
    }
}
```

那么显然，在删除 "2" 的 case 时，程序执行了 `next()` 并且报错。

`next` 的源码如下：

```java
public E next() {
    checkForComodification(); // 报错的函数
    int i = cursor;
    if (i >= size)
        throw new NoSuchElementException();
    Object[] elementData = ArrayList.this.elementData;
    if (i >= elementData.length)
        throw new ConcurrentModificationException();
    cursor = i + 1;
    return (E) elementData[lastRet = i];
}
```

函数 `checkForComodification` 报错，其代码如下：

```java
final void checkForComodification() {
    if (modCount != expectedModCount)
        throw new ConcurrentModificationException();
}
```

所以，报错的根本原因是父类成员变量 `modCount` 的值与 `expectedModCount` 不同。

其中，对于 `modCount` ，有注释：

```
The number of times this list has been structurally modified. Structural modifications are those that change the size of the list, or otherwise perturb it in such a fashion that iterations in progress may yield incorrect results.
This field is used by the iterator and list iterator implementation returned by the iterator and listIterator methods. If the value of this field changes unexpectedly, the iterator (or list iterator) will throw a ConcurrentModificationException in response to the next, remove, previous, set or add operations. This provides fail-fast behavior, rather than non-deterministic behavior in the face of concurrent modification during iteration.
```

简单来说，`modCount` 维护了列表在“结构上”被修改的次数（update元素不算结构上修改）。其功能是尽早的提醒用户（即 fail-fast），避免因其他线程干扰，使正在进行的迭代产生不正确的结果。List 的 iterator() 在创建时会保存一份 `modCount` 副本为 `expectedModCount` ：

```java
private class Itr implements Iterator<E> {
    	...
        int expectedModCount = modCount;
```

在 `foreach` 循环体中调用 `remove`(remove 底层调用 `fastRemove` 删除元素) ，会使 `modCount++`，同时 `size--`：

```java
private void fastRemove(int index) {
    modCount++;
    int numMoved = size - index - 1;
    if (numMoved > 0)
        System.arraycopy(elementData, index+1, elementData, index,
                         numMoved);
    elementData[--size] = null; // clear to let GC do its work
}
```

至此，我们知道了为何会报错，即 `remove` 增加了 `modCount` 使之不再等于  `expectedModCount` 。那么问题来了，什么情况下不会报错呢？

注意到删除 “1” 的 case：

```java
while(var2.hasNext()) { // (3)
    String item = (String)var2.next(); // (1)
    if ("1".equals(item)) {
        list.remove(item); // (2)
    }
}
```

由前面的分析，若 (2) 执行后进入了下一个循环的 (1) 处，则必然会报 `ConcurrentModificationException`，但最终并没有报错。因此可以断定，(3) 处的判断没有通过：

```java
public boolean hasNext() {
    return cursor != size;
}
```

这解释了之前的疑惑：这个 case 之所以没有报错，是因为前面的删除操作使得 `size--`，而 `cursor` 恰好处于`size-1`的位置。`size--` 后，迭代器误以为此时自己已经完成迭代，且**从结果来看跳过了最后一个元素的处理！**

因此，我们可以得出结论，只要删除的元素是集合的倒数第二个元素，那么`foreach`里删除不会导致程序异常退出。

但值得注意的是，**这种情况下依然不能保证逻辑上的正确性**，因为最后一个跳过处理的元素可能也是需要删除的元素：

```java
List<String> list = new ArrayList<>();
list.add("1");
list.add("2");
list.add("3");
list.add("3");
for (String item : list) {
    if ("3".equals(item)) {
        list.remove(item);
    }
}
System.out.println(list);
```

```
结果：[1, 2, 3]
```

可以看到，在该例里，列表最后一个 3 并没有被删除。

## 其他

手册里推荐写法中的 `iterator.remove()` 之所以不会造成上述问题，原因是其操作结束后同步了 `modCount`：

```java
public void remove() {
    if (lastRet < 0)
        throw new IllegalStateException();
    checkForComodification();

    try {
        ArrayList.this.remove(lastRet);
        cursor = lastRet;
        lastRet = -1;
        expectedModCount = modCount; // 同步了 modCount
    } catch (IndexOutOfBoundsException ex) {
        throw new ConcurrentModificationException();
    }
}
```

实际上，如果你使用 JDK 1.8+，一个更好的做法是使用 `Collection::removeIf`：

```java
List<String> list = new ArrayList<>();
list.add("1");
list.add("2");
list.add("3");
list.add("3");
list.removeIf("3"::equals);
System.out.println(list);
```

```
输出：[1, 2]
```

`removeIf` 用函数式接口封装了推荐写法的逻辑，使用起来非常方便。



## 结论

1. 一定不要在 foreach 循环里进行元素的 remove/add 操作，会导致程序异常退出或逻辑错误。
2. 建议使用Iterator方式，或者 JKD 1.8 新增的 `removeIf` 方法。

